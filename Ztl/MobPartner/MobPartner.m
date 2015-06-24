//
//  MobPartner.m
//  MobPartner
//
//  Created by Adrien Couque on 13/6/12.
//  Copyright (c) 2012 Applidium. All rights reserved.
//

#import "MobPartner.h"
#import "JSON.h"
#import "SecureUDID.h"
#import "OpenUDID.h"
#import "ODIN.h"
#import "MacAddress.h"
#import "NSString+CryptoHash.h"

#define MobPartnerWSBaseURLProd @"http://iphone.mobpartner.mobi/track.php?source=sdk"
#define MobPartnerWSBaseURLPreprod @"http://iphone.mobpartner.mobi/track_test.php?source=sdk"

#define MobPartnerActionMaxOccurencesKey @"MobPartnerActionMaxOccurencesKey"
#define MobPartnerActionCurrentOccurencesKey @"MobPartnerActionCurrentOccurencesKey"
#define MobPartnerNotifIdInstallKey @"MobPartnerNotifIdInstallKey"
#define MobPartnerInstallCampaignActionId @"MobPartnerInstallCampaignActionId"
#define MobPartnerCustomCampaignActionId @"MobPartnerCustomCampaignActionId"

@interface MobPartner (Private)
- (void)startConnection;
- (void)_sendAction:(NSMutableString *)currentRequest;
- (void)_log:(NSString *)arg, ...;
@end

@implementation MobPartner
@synthesize appId = _appId;
@synthesize useSecureUDID = _useSecureUDID;
@synthesize useOpenUDID = _useOpenUDID;
@synthesize useODIN = _useODIN;
@synthesize useMacAddress = _useMacAddress;
@synthesize encodeMacAddress = _encodeMacAddress;
@synthesize useLogs = _useLogs;
@synthesize useProductionEnvironment = _useProductionEnvironment;

- (id)init {
    self = [super init];
    if (self) {
        _numberOfRetries = 0;
        _retryDelay = 2;
        _timeout = 30;
        _currentAttempt = 0;
        _data = [[NSMutableData alloc] init];
        _urlResponse = nil;
        
        _useSecureUDID = YES;
        _useOpenUDID = YES;
        _useODIN = YES;
        _useMacAddress = YES;
        _encodeMacAddress = YES;

        _useLogs = NO;
        
        _useProductionEnvironment = NO;
    }
    return self;
}

+ (MobPartner *)tracker {
    static MobPartner * tracker = nil;
    if (tracker == nil) {
        tracker = [[MobPartner alloc] init];
    }
    return tracker;
}

- (void)trackInstall:(NSString *)campaignActionId {
    NSString * notifIdInstall = [[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerNotifIdInstallKey];
    if (!notifIdInstall) {
        [[NSUserDefaults standardUserDefaults] setObject:campaignActionId forKey:MobPartnerInstallCampaignActionId];
        [[NSUserDefaults standardUserDefaults] synchronize];
        
        NSMutableString * currentRequest = [NSMutableString stringWithString:(_useProductionEnvironment ? MobPartnerWSBaseURLProd : MobPartnerWSBaseURLPreprod)];
        
        NSAssert(self.appId != nil && self.appId.length > 0, @"Invalid app id  : should not be empty");
        [currentRequest appendFormat:@"&app_id=%@", self.appId];
        [currentRequest appendFormat:@"&campaign_action_id=%@", campaignActionId];
        
        [self _sendAction:currentRequest];
    }
}

- (void)trackAction:(NSString *)campaignActionId occurrences:(NSString *)maxOccurences {
    NSAssert(maxOccurences && ((maxOccurences.length > 0 && [maxOccurences intValue] > 0) || maxOccurences.length == 0), @"Wrong value for maxOccurences : should be @\"\" or an NSString containing a number > 0");
    [[NSUserDefaults standardUserDefaults] setObject:maxOccurences forKey:MobPartnerActionMaxOccurencesKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    NSString * currentOccurences = [[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerActionCurrentOccurencesKey];
    if (currentOccurences) {
        NSArray * currentOccurencesArray = [currentOccurences componentsSeparatedByString:@" "];
        NSString * key = [currentOccurencesArray objectAtIndex:0];
        NSString * occurrencesString = [currentOccurencesArray objectAtIndex:1];
        int occurrences = [occurrencesString intValue];
        
        if ([campaignActionId isEqualToString:key]) {
            if(maxOccurences.length > 0 && [maxOccurences intValue] > 0 && [maxOccurences intValue] <= occurrences) {
                return;
            }
        } else {
            [[NSUserDefaults standardUserDefaults] setObject:[NSString stringWithFormat:@"%@ %i", campaignActionId, 0] forKey:MobPartnerActionCurrentOccurencesKey];
        }
    } else {
        [[NSUserDefaults standardUserDefaults] setObject:[NSString stringWithFormat:@"%@ %i", campaignActionId, 0] forKey:MobPartnerActionCurrentOccurencesKey];
    }

    
    NSString * notifIdInstall = [[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerNotifIdInstallKey];
    if (notifIdInstall) {
        NSMutableString * currentRequest = [NSMutableString stringWithString:(_useProductionEnvironment ? MobPartnerWSBaseURLProd : MobPartnerWSBaseURLPreprod)];
        
        NSAssert(self.appId != nil && self.appId.length > 0, @"Invalid app id  : should not be empty");
        [currentRequest appendFormat:@"&app_id=%@", self.appId];
        [currentRequest appendFormat:@"&campaign_action_id=%@", campaignActionId];
        
        [currentRequest appendFormat:@"&notif_id_install=%@", notifIdInstall];
        
        [self _sendAction:currentRequest];
    } else {
        [[NSUserDefaults standardUserDefaults] setObject:campaignActionId forKey:MobPartnerCustomCampaignActionId];
        [[NSUserDefaults standardUserDefaults] synchronize];
        [self trackInstall:[[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerInstallCampaignActionId]];
    }
    
    
}

- (void)dealloc {
    [_appId release], _appId = nil;
    [_urlResponse release], _urlResponse = nil;
    [_data release], _data = nil;
    [_connection release], _connection = nil;
    [_request release], _request = nil;
    [super dealloc];
}

#pragma mark NSURLConnection delegate
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    // Warning : this can be called multiple times, for example in the case of a redirect
    [_urlResponse release];
    _urlResponse = [response retain];
    [_data setLength:0];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data {
	[_data appendData:data];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
	[self _log:@"[FAILURE] Couldn't load %@",error];
    // release the connection
    [_connection release];
    _connection = nil;
    if (_currentAttempt <= _numberOfRetries) {
        [self performSelector:@selector(startConnection) withObject:nil afterDelay:_retryDelay];
    } else {
        [_request release];
        _request = nil;
    }
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    // release the connection, and the data object
    [_connection release], _connection = nil;
    [_request release], _request = nil;
    
    NSString * responseString = [[NSString alloc] initWithData:_data encoding:NSASCIIStringEncoding];
    NSDictionary * response = [responseString JSONValue];
    [responseString release];
    NSAssert([response isKindOfClass:NSDictionary.class], @"Wrong return type");
//    [self _log:@"response : %@", response];
    
    if ([[response objectForKey:@"statut"] isEqualToString:@"ok"]) {
        if ([response objectForKey:@"notif_id_install"]) {
            [self _log:@"Install tracking successful"];
            [[NSUserDefaults standardUserDefaults] setObject:[response objectForKey:@"notif_id_install"] forKey:MobPartnerNotifIdInstallKey];
            [[NSUserDefaults standardUserDefaults] synchronize];
            
            NSString * customCampaignActionId = [[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerCustomCampaignActionId];
            if (customCampaignActionId) {
                [[NSUserDefaults standardUserDefaults] setObject:nil forKey:MobPartnerCustomCampaignActionId];
                [[NSUserDefaults standardUserDefaults] synchronize];
                [self trackAction:customCampaignActionId occurrences:[[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerActionMaxOccurencesKey]];
            }
        } else {
            [self _log:@"Action tracking successful"];
            if ([[[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerActionMaxOccurencesKey] intValue] > 0) {
                NSString * currentOccurences = [[NSUserDefaults standardUserDefaults] objectForKey:MobPartnerActionCurrentOccurencesKey];
                NSArray * currentOccurencesArray = [currentOccurences componentsSeparatedByString:@" "];
                NSString * key = [currentOccurencesArray objectAtIndex:0];
                NSString * occurrencesString = [currentOccurencesArray objectAtIndex:1];
                int occurrences = [occurrencesString intValue];
                [[NSUserDefaults standardUserDefaults] setObject:[NSString stringWithFormat:@"%@ %i", key, occurrences+1] forKey:MobPartnerActionCurrentOccurencesKey];   
            }

        }
    } else {
        [self _log:@"Error (code %@) : %@", [response objectForKey:@"error_code"], [response objectForKey:@"code_desc"]];
    }
}

@end

@implementation MobPartner (Private)
- (void)startConnection {
    [_connection release], _connection = [[NSURLConnection alloc] initWithRequest:_request delegate:self];
    [self _log:@"requested : %@", _request];
    if (_connection) {
        [_data setLength:0];
        _currentAttempt++;
    } else {
        [self _log:@"[FAILURE] Couldn't start loading %@", _request.URL];
        [_request release];
    }
}

- (void)_sendAction:(NSMutableString *)currentRequest {
    NSAssert(_useSecureUDID || _useOpenUDID || _useODIN || _useMacAddress, @"You need to use at least one id : SecureUDID, OpenUDID, ODIN or MacAddress");
    if (_useSecureUDID) {
        [currentRequest appendFormat:@"&secureudid=%@", [SecureUDID UDIDForDomain:[[NSBundle mainBundle] bundleIdentifier] usingKey:@"MobPartnerSecureUDIDKey"]];
    }
    if (_useOpenUDID) {
        [currentRequest appendFormat:@"&openudid=%@", [OpenUDID value]];
    }
    if (_useODIN) {
        [currentRequest appendFormat:@"&odin=%@", ODIN1()];
    }
    if (_useMacAddress) {
        if (_encodeMacAddress) {
            [currentRequest appendFormat:@"&macaddress_md5=%@", [[MacAddress getMacAddress] MD5]];
            [currentRequest appendFormat:@"&macaddress_sha1=%@", [[MacAddress getMacAddress] SHA1]];
        } else {
            [currentRequest appendFormat:@"&macaddress=%@", [MacAddress getMacAddress]];
        }
    }
    [currentRequest appendFormat:@"&model=%@", [[UIDevice currentDevice] model]];
    [currentRequest appendFormat:@"&useragent_app=%@", [[NSBundle mainBundle] bundleIdentifier]];
    [currentRequest appendFormat:@"&lang=%@", [[NSLocale preferredLanguages] objectAtIndex:0]];
    [currentRequest appendFormat:@"&osversion=%@", [[UIDevice currentDevice] systemVersion]];
    [currentRequest appendFormat:@"&region=%@", [[NSLocale currentLocale] localeIdentifier]];
    [currentRequest appendFormat:@"&country=%@", [[NSLocale currentLocale] displayNameForKey:NSLocaleCountryCode value:[[NSLocale currentLocale] objectForKey:NSLocaleCountryCode]]];


    
    [_data release], _data = [[NSMutableData alloc] init];
    [_request release], _request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:[currentRequest stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]]];
    [self startConnection];
}

- (void)_log:(NSString *)text, ... {
    if (_useLogs) {
        va_list args;
        va_start(args, text);
        NSLogv(text, args);
        va_end(args);
    }
}
@end
