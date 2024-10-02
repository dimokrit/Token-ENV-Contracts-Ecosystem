
#### Documentation for the LizardLaunchpad contract
### Logic
The LizardLaunchpad contract is designed to manage the token sale and vesting processes. Users can participate in private and public sales, as well as receive tokens in accordance with the conditions of each stage of vesting.

To set the westing conditions, the owner must call the newStage function with the following parameters:
bool whitelist: will the stage take place according to whitelist
bool sale: will there be a token sale or distribution
uint maxUsers: the maximum number of users for a stage, if there are no restrictions, is 0
uint totalTokenAmount: the maximum number of tokens for a stage (a value must be specified)
uint percentTGE: percentage of TGE, the percentage of the total number of user tokens that will be sent or available for branding immediately after the start of the stage
uint totalPaymentPeriod: the total westing time for which all tokens will be paid, not including the lockUp period, should be specified in unix time
uint paymentPeriod: the period in which a new portion of tokens will be unblocked, specify in unix time
uint lockUpPeriod: the lock period (cliff) before the start of vesting, specify in unix time
uint maxAmountForUser: the maximum number of tokens that a user can buy at a stage, if there are no restrictions, is 0. Only for sale stages
bytes32 merkleRoot: the root of the Merkle tree generated from the address list, if not used, still 0x0000000000000000000000000000000000000000000000000000000000000000. Only for whitelist stages

Each stage has its own index, it is determined sequentially, starting from 1.
If the conditions for all stages are known in advance, they can be set in the constructor by calling the newStage function.
## User and admin path
    
The user has 3 options for obtaining tokens: distribution, purchase and airdrop.
1. **Distribution**
   - The admin sets the stage conditions with the newStage function (required sale = false).
   - The admin opens the registration for the stage with the toggleRegistrationState function.
   - After that, users register for the stage using the functions: stageRegistration - for the stage without a whitelist and stageRegistrationWL - for the stage with a whitelist.
   - Next, the admin starts the stage using the toggleStageState function, at this point the number of tokens per user is calculated according to the formula (all tokens of the stage / all registered users), and the countdown of the lockUp period begins.
   - After that, users can only collect their tokens using the claim function, they will be automatically unblocked according to the vesting conditions.

2. **Purchase**
   - The admin sets the stage conditions with the newStage function (required sale = true).
   - Next, the admin starts the stage using the toggleStageState function.
   - After that, users buy tokens at a set price using the functions: publicSale - for the stage without a whitelist and privateSale - for the stage with a whitelist, at this point thecountdown of the lockUp period begins.
   - After that, users can only collect their remaining tokens using the claim function, they will be automatically unblocked according to the vesting conditions.

3. **Airdrop**
   - The admin sets the stage conditions with the newStage function (required sale = false).
   - Next, the admin calls the airdrop function, and tokens are sent according to the conditions of the stage, at which point the countdown of the lockUp period begins.
   - After that, users can only collect their remaining tokens using the claim function, they will be automatically unblocked according to the vesting conditions.

When calling any function, the index of the stage is passed to it, there can be as many stages as you want, they can go in parallel, the main thing is to know which index of which stage.

## How does vesting work

1. **TGE**
   The percentage of TGE indicates how many tokens out of the total the user should receive.
   - Example 1: token distribution stage, percentage TGE = 20, after the start of the stage, 1000 is allocated for each user, he can immediately call the claim function and pick up 200 tokens, the remaining 800 he receives according to the conditions of the stage.
   - Example 2: the token sale stage, the percentage of TGE = 20, the user buys 1000 tokens, 200 tokens immediately come to his wallet, he receives the remaining 800 according to the conditions of the stage.
   - Example 3: the token airdrop stage, if each user, according to the airdrop, is determined by 1000, and TGE = 20, then he will receive 200, the remaining 800 he receives according to the conditions of the stage.

2. **LockUp**
   The LockUp period indicates how long the tokens will be locked on the contract before the start of payments.
   - Example 1: token distribution stage, percentage TGE = 20, LockUp = 2592000 (30 days), after the start of the stage, 1000 are allocated for each user, he can immediately call the claim function and pick up 200 tokens, 800 tokens are blocked for 30 days, then he receives them according to the vesting conditions.
   - Example 2: the token sale stage, the percentage of TGE = 20, LockUp = 2592000 (30 days), the user buys 1000 tokens, 200 tokens immediately come to his wallet, 800 tokens are blocked for 30 days, then he receives them according to the vesting conditions.
   - Example 3: the token airdrop stage, if each user, according to the airdrop, is determined by 1000, TGE = 20, LockUp = 2592000 (30 days), then he will receive 200, 800 tokens are blocked for 30 days, then he receives them according to the conditions of the stage.

3. **Payment periods**
   TotalPaymentPeriod - the total time of vesting (token issuance), for which all tokens will be paid, not including the lockup period.
   PaymentPeriod specifies the time period in which a new portion of tokens will be unblocked.
   Variables must be specified so that the remainder of the division of TotalPaymentPeriod by PaymentPeriod is equal to 0.
   - Example 1: token distribution stage, percentage TGE = 20, LockUp = 2592000 (30 days), TotalPaymentPeriod = 8640000 (100 days), PaymentPeriod = 1728000 (20 days), after the start of the stage, 1000 are allocated for each user, he can immediately call the claim function and pick up 200 tokens, 30 days 800 tokens are blocked, then after 20 days he can take 160 tokens, and then 4 more times 160 tokens every 20 days.
   - Example 2: token sale stage, percentage TGE = 0, LockUp = 0, TotalPaymentPeriod = 8640000 (100 days), PaymentPeriod = 1728000 (20 days), the user buys 1000 tokens, after 20 days he can pick up 200 tokens, and then 4 more times 200 tokens every 20 days.
   - Example 3: the token airdrop stage, if each user, according to the airdrop, is determined by 1000, TGE = 20, LockUp = 0, TotalPaymentPeriod = 8640000 (100 days), PaymentPeriod = 8640000 (100 days), then he will receive 200, after 100 days he can pick up the remaining 800 tokens.

If it is necessary to issue all tokens to the user at once, then the percentage of TGE is set to 100.
If it is necessary to issue all tokens to the user after a certain time, then the percentage of TGE is set to 0, the LockUp period is 0, TotalPaymentPeriod = PaymentPeriod = the time after which the user will be able to collect tokens.

### The main functions of the contract:

## User Functions

1. **stageRegistration**
   - Allows users to register at the stage without a whitelist.
   - Checks that registration has started at the stage, the user is not blocked or registered earlier.

2. **stageRegistrationWL**
   - Allows users to register at the whitelist stage.
   - Checks that registration has started at the stage, the user is not blocked, and provides proof of inclusion in the whitelist.

3. **privateSale**
   - Allows users to buy tokens at the stage of private sale.
   - Checks that the sale stage has begun, the user is not blocked, and provides proof of inclusion in the whitelist.

4. **publicSale**
   - Allows users to buy tokens at the stage of public sale.
   - Checks that the sale stage has started and the user is not blocked.

5. **claim**
   - Allows users to receive their tokens in accordance with the terms of the vesting.
   - Checks that the user is registered, the stage has started, and the user is not blocked.

## Admin functions

1. **adminRegistration**
   - The administrator can register addresses in the whitelist to participate in private sales.
   - Checks that the registration has started at the stage and the stage is not the stage of sale.

2. **newStage**
   - The administrator can add new stages of sale and vesting with certain conditions.
   - Sets stage parameters such as whitelist usage, number of users, percentage of TGE, blocking periods and payouts.

3. **toggleRegistrationState**
   - Allows the administrator to change the registration status at the stage.
   - Checks the correctness of the stage index.

4. **toggleStageState**
   - Allows the administrator to change the stage status.
   - Sets the stage parameters, such as the number of tokens for the user, the first amount to receive and the start time.

5. **setBlacklist**
   - Allows the administrator to add and remove addresses from the blacklist.
   - Calling the function again for the same address removes it from the blacklist.

6. **setPublicSalePrice**
   - Allows the administrator to set the price for public sale.

7. **setPrivateSalePrice**
   - Allows the administrator to set the price for a private sale.

8. **airdrop**
   - The administrator can initiate an airdrop of tokens.
   - Sets the number of tokens for airdrop and selects recipients based on whitelist or other criteria.

9. **changeStageSettings**
   - Allows the administrator to change the settings of an existing stage.
   - Can change parameters such as TGE percentage, lockout periods, payouts and number of users.
   - Available only before the start of the stage.

10. **Withdrawal**
   - Allows the administrator to withdraw all funds from the contract.
   - Funds are sent to the address of the contract owner.

11. **withdrawPart**
   - Allows the administrator to withdraw part of the contract funds.
   - The amount to be withdrawn is indicated.
   - Funds are sent to the address of the contract owner.

## Get functions

1. **getStage**
   - Returns information about a specific stage by its index.
   - Allows you to get data on stage parameters such as whitelist usage, sale status, maximum number of users, total number of tokens, percentage of TGE, percentage of linear distribution, start time, payout period, total payout period, lock period, maximum number of tokens for a user and Merkle root.

2. **getUserIsRegistered**
   - Checks whether the user is registered at the stage.
   - Returns `true` if the user is registered, and `false` otherwise.

3. **getUserAvailableAmount**
   - Returns the number of tokens currently available for the user to receive.
   - Takes into account all the conditions of the stage, such as TGE, lock periods and line payments.

4. **getUserNextUnlockTime**
   - Returns the time of the next token unlock for the user.
   - Helps the user to find out when he will be able to receive the next part of the tokens.

5. **getUserReceivedAmount**
   - Returns the total number of tokens that the user has already received at the moment.
   - Helps to keep track of how many tokens the user has already taken from those available to him according to the conditions of the stage.

6. **getUserBoughtAmount**
   - Returns the number of tokens purchased by the user at the sales stage.
   - Allows the user to find out how many tokens he purchased during the sales phase.

The contract uses the ERC20 token (LizardToken) for token transactions