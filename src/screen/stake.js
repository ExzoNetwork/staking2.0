import React, {useState, useRef, useEffect} from 'react';
import { formatStakeAmount, amountToBN, formatAmount } from '../format-value';
import InputComponent from '../input'
import Header from '../header';
import Actions from '../actionsContainer';
import Notice from '../notice';
import Enterance from '../enterance';
import ButtonBlock from '../buttonBlock';
import BN from 'bn.js';
import Loader from '../loader';
import Alert from '@mui/material/Alert';
import {ErrorParser} from '../errorParser';

const Stake = (props) => {
  const { lang, info } = props;
  const {
    stakingStore,
    setShowStakeMore,
    setShowDetails,
    showStakeMore,
  } = props;
  const validatorDetails = stakingStore.getValidatorDetails();

  const available_balance = validatorDetails ? validatorDetails.available_balance : '0';

  const [values, setValues] = React.useState({
    amount: '',
  });

  const IS_AMOUNT_GREATER_THAN_BALANCE_MINUS_ONE = amountToBN(values.amount).gt(
    available_balance.sub(new BN(1e9))
  );
  const IS_SEND_STAKE_DISABLED =
    !values.amount ||
    (parseFloat(values.amount) && IS_AMOUNT_GREATER_THAN_BALANCE_MINUS_ONE) ||
    +values.amount === 0 ||
    values.amount === '.';

  const [showStakeActions, setShowStakeActions] = React.useState(false);
  const [showStakingEnterance, setShowStakingEnterance] = React.useState(false);
  const [stakingInProcess, setStakingInProcess] = React.useState(false);
  const [stakingError, setStakingError] = React.useState(null);

  const backToStakeMore = () => {
    setShowStakeActions(false);
    setShowStakeMore(true)
  }

  const goToStakingEnterance = () => {
    setShowStakeActions(false);
    setShowStakingEnterance(true)
  }

  const backToStakeActions = () => {
    setShowStakingEnterance(false);
    setShowStakeActions(true)
  }

  const backToDetailsFromStakeMore = () => {
    setShowStakeMore(false);
    setShowDetails(true);
  };

  const goToDetailsFromEnterance = () => {
    setShowDetails(true);
    setShowStakingEnterance(false)
  }


  const handleChange = (text) => {
    setValues({ ...values, amount: text });
  };

  const onClickMax = (text) => {
    if (available_balance.sub(new BN(1e9)).lt(new BN('10000000', 10))) {
      return null;
    }
    setValues({ ...values, amount: formatAmount(available_balance.sub(new BN(1e9))) });
  }



  const goToActions = () => {
    if (IS_SEND_STAKE_DISABLED) return null;
    setShowStakeMore(false);
    setShowStakeActions(true)
  };

  const confirm = async () => {
    if (!values.amount) return null;
    const amount = new BN(Math.floor(parseFloat(values.amount) * 1e9) + '', 10);
    setStakingInProcess(true);

    try {
      const details = stakingStore.getValidatorDetails();
      if (!details) {
        setStakingInProcess(false);
        return setStakingError("An error occurred. Please try again.");
      }
      const ADDRESS = details.address;
      const result = await stakingStore.stake(ADDRESS, amount);
      console.log({result});
      if (result && result.error) {
        setStakingInProcess(false);
        const errMsg = ErrorParser.parse(result.error);
        setStakingError(errMsg);
        return;
      }
      goToStakingEnterance();
    } catch (err) {
      console.log("err", err);
      setStakingInProcess(false);
      setStakingError(err);
    }
    setStakingInProcess(false);
    setValues({amount: ''})
    //stakingStore.chosenValidator.requestStakeAccountsActivation(true);
  };

  return (
    <>
    <Loader
      show={stakingInProcess}
      text={lang.progressStaking || 'Staking in progress...'}
      info={info}
    />
    {showStakeMore && (
      <div className="staking stake-more index-width-container" style={styles.widthContainer}>
        <Header onClickBack={backToDetailsFromStakeMore}/>
        <InputComponent
          lang={lang}
          info={info}
          value={values.amount}
          onChange={(text) => handleChange(text)}
          maxValue={available_balance}
          onClickMax={onClickMax}
          />
          {(amountToBN(values.amount+"").gte(available_balance.sub(new BN(1e9)))) &&
            <Notice mt={20} text={lang.dontStake || "Don't stake all coins, leave some (~1 XZO) to pay transaction fees in the future and be able to initiate stake withdrawals."}/>
          }

        <ButtonBlock
          lang={lang}
          text={lang.continue || "Next"}
          onClickNext={goToActions}
          nextDisabled={IS_SEND_STAKE_DISABLED}
        />
      </div>
    )}
    {showStakeActions && (
      <div className="staking index-width-container" style={styles.widthContainer} >
        {stakingError && (
          <>
            <Alert
              onClose={() => {setStakingError(null)}}
              severity="error"
              id="error"
              style={styles.styleAlert}>
                { stakingError.toString() }
            </Alert>
          </>
        )}
        <Header onClickBack={backToStakeMore}/>
        <Actions
          stakingStore={stakingStore}
          amountToConvert={values.amount}
          lang={lang}
        />
        <Notice text={lang.noticeStakingRewards || "Staking rewards will be reinvested and added to the stake."}/>
        <ButtonBlock lang={lang} text={lang.confirm || "Confirm"} onClickNext={confirm}/>
      </div>
    )}
    {showStakingEnterance && (
      <div className="staking index-width-container" style={styles.widthContainer}>
      <Header/>
      <Enterance lang={lang} enteranceImg title={lang.stakingEnteranceTitle || 'Stake account has been created successfully'} subtitle={lang.stakingEnteranceSubTitle || 'It is not fully active immediately, it may take multiple epochs to warm it up.'} link/>
      <ButtonBlock lang={lang} text={lang.ok || "Ok"} onClickNext={goToDetailsFromEnterance}/>
    </div>
    )}
    </>
  );
};

const styles = {
  widthContainer:{
    width: 430
  },
  styleAlert: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 99,
    padding:10,
    borderRadius: 0
  },
}

export default Stake;
