//
//  MobPartner.h
//  MobPartner
//
//  Created by Adrien Couque on 13/6/12.
//  Copyright (c) 2012 Applidium. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface MobPartner : NSObject {
    NSMutableData *              _data;
    NSURLResponse *              _urlResponse;
    NSURLConnection *            _connection;
    NSMutableURLRequest *        _request;
    
    NSTimeInterval               _timeout;
    NSInteger                    _currentAttempt;
    NSInteger                    _numberOfRetries;
    NSTimeInterval               _retryDelay;

}
@property (nonatomic, retain) NSString * appId;

@property (nonatomic, assign) BOOL useSecureUDID; //Default is YES
@property (nonatomic, assign) BOOL useOpenUDID; //Default is YES
@property (nonatomic, assign) BOOL useODIN; //Default is YES
@property (nonatomic, assign) BOOL useMacAddress; //Default is YES
@property (nonatomic, assign) BOOL encodeMacAddress; //Default is YES

@property (nonatomic, assign) BOOL useLogs; //Default is NO

@property (nonatomic, assign) BOOL useProductionEnvironment; //Default is YES

+ (MobPartner *)tracker;
- (void)trackInstall:(NSString *)campaignActionId;
- (void)trackAction:(NSString *)campaignActionId occurrences:(NSString *)maxOccurences;

@end
