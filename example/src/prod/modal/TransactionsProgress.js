import React, {useState, useEffect} from 'react';
import Header from '../header';
import Enterance from '../enterance';
import { Observer } from 'mobx-react';
import LinearProgress from '@mui/material/LinearProgress';
import BN from 'bn.js';
import { formatStakeAmount, amountToBN, formatAmount } from '../format-value';
import Button from '@mui/material/Button';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { sendAndConfirmTransaction } from '@velas/web3';
import Alert from '@mui/material/Alert';
import ButtonBlock from '../buttonBlock';
import {ErrorParser} from '../errorParser';

const TransactionsProgress = (props) => {
  const {lang} = props;
  const [txs, setTxs] = React.useState([]);
  const [withdrawError, setWithdrawError] = React.useState(null);
  const disabled = props.disabled || false;
  const transactions = props.transactions.filter(it => it.transaction);
  const stakingStore = props.stakingStore;

  const styleAlert = {
    position: "absolute",
    top: '0%',
    right: 0,
    left: 0,
    zIndex: 99,
    padding:10,
    borderRadius: 0
  }
  const gotoSuccessWithdrawStep = () => {
    props.gotoSuccessWithdrawStep();
  }
  const backToDetailsFromWithdrawFinalStep = () => {
    props.stakingStore.txsProgress = new Array(20).fill({state:""});
  };

  const goToSuccessWithdraw = () => {
    props.setShowSuccessWithdraw(true);
  }


  if (!stakingStore.txsProgress || stakingStore.txsProgress.filter(it => it.transaction).length <= 0) return null;

  const title =
    stakingStore.actionLabel === 'withdraw' ?
      "Withdrawal final step" :
      "Request withdraw final step";

  const subtitle =
    stakingStore.actionLabel === 'withdraw' ?
      "In order to withdraw you should make "+ transactions.length + " operations:" :
      "In order to request withdraw you should make "+ transactions.length + " operations:";

  // Mocked txs array for testing retrieving tx status.
  //const signatures = ["5L8CQNFAJXvf3FboLebCtq4sNu67jugca6HkFejAUwU4r84vAqaJvaG7jqssATezfxapt6dQrkJopuYNpDaNoJ18", "512wGX82LKyb2wjZLXGwFD2CHbNjZqG6ToZf2qxadArdHnxWeRncN6vPCzJMTfNJ5UjCmHfD8sYWFKh33Sgc8BfQ"];

  return (
    <Observer>
      {() => {

        if (props.showSuccessWithdraw){
          return (
            <div className="staking index-width-container" style={styles.widthContainer}>
              <Enterance lang={lang} exitValidatorImg title='Withdrawal has been submitted successfully' subtitle='It make take a few minutes to appear on your balance.'/>
              <ButtonBlock lang={lang} text={lang.ok || "Ok"} onClickNext={props.goToDetailsFromSuccessWithdraw}/>
            </div>
          )
        }

        return (
        <div className="staking modal-container index-width-container" style={styles.modalContainer}>
          <div className="modal-inner-container" style={styles.modalInnerContainer}>
            { withdrawError &&
              <Alert
                onClose={() => {setWithdrawError(null)}}
                severity="error"
                id="error"
                style={styleAlert}>
                  { withdrawError }
                </Alert>
            }
            <Header onClickBack={backToDetailsFromWithdrawFinalStep}/>
            <Enterance lang={lang} exitValidatorImg
              title={title}
              subtitle={subtitle}/>
              <div className="txs-list" style={styles.txsList}>
                {stakingStore.txsProgress.filter(it => it.transaction).map((item, index) => {

                  const progress = item.progress;
                  const amount = formatStakeAmount(item.sendAmount || new BN('0')).toString(10);


                  const sendTx = async () => {
                    if (item.state === 'loading') return;
                    if (item.state === 'loaded') return;

                    item.state = 'loading';

                    try {
                      const signature = await stakingStore.sendTransaction(item.transaction);
                      //Used for modeling sending txs
                      //const signature = signatures.pop();
                      stakingStore.checkTx(
                        {
                          tx: signature,
                          start: Date.now()
                        }, function(err, info){
                          if (err != null) {
                            setWithdrawError("An error occurred during action.")
                            return item.state = 'error';
                          }
                          item.state = 'loaded';

                          //Check if all txs was completed successfully
                          const allTxsNotCompleted =
                            stakingStore.txsProgress.filter(it => it.transaction).find((item) => {
                              return item.state !== 'loaded';
                            })
                          if (!allTxsNotCompleted)
                            setTimeout(async () => {

                              if (stakingStore.actionLabel === 'withdraw') {
                                gotoSuccessWithdrawStep();
                              } else {
                                stakingStore.txsProgress = new Array(20).fill({state:""});
                                props.goToSuccessRequestWithdrawStep();
                              }
                              //await stakingStore.reloadWithRetryAndCleanCache();
                              stakingStore.chosenValidator.requestStakeAccountsActivation(true);
                            }, 1)

                        }
                      )
                    } catch (err) {
                      const errMsg = ErrorParser.parse(err);
                      setWithdrawError(errMsg)
                      item.state = 'error';
                    }
                  }
                  const action = stakingStore.actionLabel === 'withdraw' ? 'Withdraw' : 'Request';
                  const btnText = item.state === 'loading' ? 'loading...' : `${action} ${amount} VLX`;
                  const endIcon = (item.state === 'loading' || !item.state) ? null : ( item.state === 'loaded' ? <CheckCircle color='primary'/> : <ErrorIcon color='primary'/>)
                  return(
                    <div key={`row_${index}`} className="tx-progress" style={styles.txProgress}>

                      <Button variant="outlined"
                        key={`btn_${index}`}
                        onClick={sendTx}
                        endIcon={endIcon}
                        style={styles.styleBtnGreen}
                        className="button-block-style-btn-green">
                        {btnText}
                      </Button>

                    </div>
                  )
                }
                )}
              </div>
          </div>
        </div>
        )
      }}
    </Observer>
  )

}
const styles = {
  modalContainer:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    background: '#141637',
  },
  modalInnerContainer: {
    margin: 'auto',
    padding: 10,
    textAlign: 'center',
  },
  txProgress:{
    marginBottom: 0,
    padding: 0
  },
  widthContainer:{
    width: 430
  },
  styleBtnRed: {
    background: '#FB5252',
    padding: 12,
    minWidth: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    color: "#fff",
    fontSize: 12,
  },
  styleBtnGreen:{
    background: '#0BFFB7',
    padding: 12,
    minWidth: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    fontSize: 12,
  },
  txsList:{
    overflow: "scroll",
    maxHeight: 240
  }
}

export default TransactionsProgress;
