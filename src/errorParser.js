
export class ErrorParser {
  static parse(error) {
    const result = error.code && error.message ? error.message.toString() : error.toString();
    const parsedResult = (function(){
      switch(true){
        case (result || "").toString().indexOf('Attempt to debit an account but found no record of a prior credit') > -1 :
          return "Not enough XZO Native balance for this transaction.";
        case ((result || "").toString().indexOf('custom program error: 0x1') > -1) ||
             ((result || "").toString().indexOf('insufficient funds for instruction') > -1):
          return "Failed to get the latest data, please refresh and try again.";
        case result.description:
          return result.description;
        default:
          return "Something went wrong. Please contact support or go back and try to use Staking 1.0 in the DApp section.\n\n" +result.toString();
      }
    }());

    return parsedResult;
  }
}
