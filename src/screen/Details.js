import React, {useState, useEffect} from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CachedIcon from '@mui/icons-material/Cached';
import Jdenticon from 'react-jdenticon';
import { Observer } from 'mobx-react';
import BN from 'bn.js';

import { formatStakeAmount, amountToBN, formatAmount, wrapNumber, formatToFixed } from '../format-value';
import Badge from '../badge';
import InfoBlock from '../infoBlock';
import Tabs from '../tabs';
import ButtonBlock from '../buttonBlock';
import InputComponent from '../input'
import Header from '../header';
import Loader from '../loader';
import {ErrorParser} from '../errorParser';

const widthContainer = {
  width: 430
}
const styleSpinner = {
  top: '48%',
  position: "absolute",
  left: '48%',
  color: "#fff"
}
const styleAlert = {
  position: "absolute",
  top: '0%',
  right: 0,
  left: 0,
  zIndex: 99,
  padding:10,
  borderRadius: 0
}

const WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE = 102;

const DetailsValidator = (props) => {

  const {
    lang,
    info,
    details,
    setShowDetails,
    showDetails,
    stakingStore,
    withdrawInProgress,
    setWithdrawInProgress,

    setValidator,
    setShowSuccessWithdraw,
    showStakePage,
    setShowSuccessWithdrawFinal,
    onClickRequest,
    setWithdrawError,
    withdrawError,
    backDetailsPage,
    setShowStakeMore,

  } = props;

  const { address, activeStake, apr, name, nodePubKey, show, status } = details;
  const [ copy, setCopy ] = React.useState(false);
  const [ _details$, setDetails ] = React.useState(false);
  const [ _stakeDataWasLoaded, setStakeDataWasLoaded ] = React.useState(false);


  useEffect(() => {
    const validator = stakingStore.chosenValidator;
    setValidator(validator);
    const stakeDataWasLoaded =
      !validator.myStake || validator.myStake.isZero() || validator.totalActiveStake !== null && validator.totalInactiveStake !== null;
    setStakeDataWasLoaded(stakeDataWasLoaded);
    const force = !stakeDataWasLoaded;
    validator.requestStakeAccountsActivation(force);
  }, [_stakeDataWasLoaded]);

  if (!showDetails || !stakingStore.chosenValidator) return null;
  const withdrawAvailable = () => {
    setShowDetails(false);
    alert('some spinner'); //add spinner
    setShowSuccessWithdraw(true);
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopy(true)
  }
  const onClickExplorer = () => {
    window.open(`https://native.velas.com/address/${showStakePage.address}`);
  }

  setTimeout(function(){
    var message = document.getElementById('message');
    if (message) {
      document.getElementById('message').style.display = 'none';
      setCopy(false)
    }
  }, 2000);



  if (!stakingStore.chosenValidator || !details) {
    showStakePage.show = false;
    return null;
  }

  const onPressReload2 = async () => {
    stakingStore.getValidatorsError = null;
    await stakingStore.reloadWithRetryAndCleanCache();
  }

  return (
    <Observer>
      {() => {

        const Loading = () => {
          return (
            <Box sx={styleSpinner}>
            <CircularProgress color='inherit'/>
          </Box>
          )
        }

        if (stakingStore.isRefreshing || stakingStore.isLoading){
          return (
            <div style={{ flex: 1, alignItems: 'center' }}>
              <Loading/>
            </div>
          );
        }

        const _details = stakingStore.getValidatorDetails();
        //console.log("_details", _details)
        if (!_details){
          return null;
        }

        const TOTAL_STAKE =
            _details.totalAvailableForWithdrawRequestStake &&
            formatAmount(_details.totalAvailableForWithdrawRequestStake);
        const ADDRESS = _details.address;

        const onPressWithdraw = async () => {
          //return console.log("[onPressWithdraw]")
          if (!_details || !_details.availableWithdrawRequested) return;
          setWithdrawInProgress(true);
          try {
            const result = await stakingStore.withdrawRequested(address);
            if (result.error) {
              setWithdrawInProgress(false);
              if (result.code && result.code === WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE) {
                setShowSuccessWithdrawFinal(true);
                return setWithdrawInProgress(false);
              }
              const errMessage = ErrorParser.parse(result.error);
              return setWithdrawError(errMessage);
            }
            //const result1 = await stakingStore.reloadWithRetryAndCleanCache();
          } catch (err) {
            setWithdrawInProgress(false);
            const msg = ErrorParser.parse(err);
            setWithdrawError(msg)
            return;
          }
          stakingStore.chosenValidator.requestStakeAccountsActivation(true);
          setShowDetails(false);
          setShowSuccessWithdraw(true);
          setWithdrawInProgress(false);
        }
        const onPressReload = async () => {
          await stakingStore.reloadWithRetryAndCleanCache();
          await stakingStore.chosenValidator.requestStakeAccountsActivation(true, stakingStore.isWebSocketAvailable());
        }

        const goToStake = () => {
          setShowDetails(false);
          setShowStakeMore(true);
        };

        const address =  _details.address || '...';
        const myStake = _details.myStake || new BN(0);
        const activeStake = _details.activeStake || new BN(0);
        const name = _details.name;
        const commission = _details.commission || '...';
        const dominance = _details.dominance || new BN(0);
        const apr = formatToFixed((_details.apr || 0) * 100) || 0;
        const myActiveStake =  _details.myActiveStake || '0';
        const onPressReloadAction = stakingStore.isWebSocketAvailable() ? null : onPressReload;

        return (
          <>
            <div className="staking index-container-details" style={widthContainer}>
              <Loader
                show={withdrawInProgress}
                text={lang.progressWithdraw || 'Withdrawing in process...'}
                info={info}
              />

              {withdrawError &&
                <Alert
                  onClose={() => {setWithdrawError(null)}}
                  severity="error"
                  id="error"
                  style={styleAlert}>
                    { withdrawError }
                </Alert>}
              {copy && <Alert severity="success" id="message" style={styleAlert}>{lang.copied || 'Copied'} { address }</Alert>}
              <Header
                onClickBack={backDetailsPage}
                onClickReload={onPressReloadAction}
                onClickExplorer={onClickExplorer}
              />
              <div style={{display: 'flex', flexDirection: "column", alignItems: "center", marginTop: 5}} className="index-details-avatar-badge">
                <Jdenticon size="55" value={ address } />
                <Badge status={status} lang={lang} top={10} bottom={0}/>
              </div>
                { myStake && !myStake.isZero() ?
                  <InfoBlock
                    lang={lang}
                    info={info}
                    address={address}
                    copyAddress={copyAddress}
                    name={name}
                    value2={wrapNumber(myActiveStake) + " %"}
                    value1={formatStakeAmount(myStake) + " VLX"}
                    titleInfo={lang.info4 || 'Only 25% of active stake can be activated per epoch.'}
                    subtitle2={lang.myActiveStake || 'My active stake'}
                    subtitle1={lang.myStake1 || 'My stake' }
                    link
                    />
                  :
                  <InfoBlock
                    lang={lang}
                    info={info}
                    address={address}
                    copyAddress={copyAddress}
                    name={name}
                    value1={apr + ' %'}
                    value2={formatStakeAmount(activeStake) + ' VLX'}
                    subtitle1={lang.annual || 'ANNUAL PERCENTAGE RATE'}
                    subtitle2={lang.totalStake1 || "Total Stake"}
                    tooltip1={lang.info3 || 'APR is calculated based on the results of the previous epoch'}
                    />
                }

                <Tabs
                  stakingStore={stakingStore}
                  validatorDetails={_details}
                  onClickStake={goToStake}
                  onClickStakeMore={goToStake}
                  onClickRequest={onClickRequest}
                  onClickWithdrawal={onPressWithdraw}
                  lang={lang}
                  info={info}
                />
            </div>
          </>
        );
      }}
    </Observer>
  );
};

export default DetailsValidator;
