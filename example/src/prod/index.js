'use strict';

import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Jdenticon from 'react-jdenticon';
import Badge from './badge';
import InfoBlock from './infoBlock';
import Tabs from './tabs';
import ButtonBlock from './buttonBlock';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CachedIcon from '@mui/icons-material/Cached';
import InputComponent from './input'
import Header from './header';
import Enterance from './enterance';
import { Observer } from 'mobx-react';
import { formatStakeAmount, amountToBN, formatAmount, wrapNumber } from './format-value';
import BN from 'bn.js';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import Stake from './screen/stake';
import Loader from './loader';
import SearchIcon from '@mui/icons-material/Search';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ReactSectionList from './reactSectionList';
import StakeItem from './stakeItem';
import { EpochCurrent } from './images/epoch-current';
import Notice from './notice';
import SortIcon from '@mui/icons-material/Sort';
import TransactionsProgress from './modal/TransactionsProgress';
import index from './index.css' //remove from prod index.js
import lang from '../lang'; //remove from prod index.js
import info from '../info'; //remove from prod index.js
import {ErrorParser} from './errorParser';

const style = {
  position: 'absolute',
  top: '53%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  // minWidth: 430,
  width: 'auto',
  bgcolor: "#151839",
  border: '1px solid rgba(255, 255, 255, 0.07)',
  p: 2,
  color: "rgb(255, 255, 255)",
  height: 600
};
const style2 = {
  position: 'absolute',
  top: '53%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '50%',
  bgcolor: "#151839",
  border: '1px solid rgba(255, 255, 255, 0.07)',
  p: 2,
  color: "rgb(255, 255, 255)",
  height: 600
};
const widthContainer = {
  width: 430
}
const widthContainer2 = {
  background: "#161a42",
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: "auto",
}
const styleSpinner = {
  top: '48%',
  position: "absolute",
  left: '48%',
  color: "#fff"
}
const styleLoaderText = {
  textAlign: 'center',
  color: '#fff',
  fontSize: 18,
};
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

const StakingPage = (props) => {
  // const { stakingStore, lang, info } = props;  //add to prod index.js
  const { stakingStore } = props;  //remove from prod index.js

  const [showStakePage, setShowStakePage] = React.useState({show: false, address: '', name: '', apr: '', status: '', nodePubKey: '', activeStake: '' });
  const onClickRequest = () => {
    setShowDetails(false);
    setShowExitWithdraw(false);
    setShowRequestWithdraw(true);
    setShowSuccessWithdraw(false);
    setShowSuccessWithdrawFinal(false);
  }

  useEffect(() => {
    setShowStakePage({show: false, address: '', name: '', apr: '', status: '', nodePubKey: '', activeStake: '' });
    setShowExitWithdraw(false);
    setShowSuccessWithdraw(false);
    setShowSuccessWithdrawFinal(false);
    stakingStore.openedValidatorAddress = null;
    stakingStore.refresh = false;
  }, [stakingStore.refresh])

  const [ withdrawError, setWithdrawError ] = React.useState(null);
  const [ withdrawInProgress, setWithdrawInProgress ] = React.useState(false);
  const [ requestWithdrawInProgress, setRequestWithdrawInProgress ] = React.useState(false);
  const [ withdrawErrorMaxTxSize, setWithdrawErrorMaxTxSize ] = React.useState(null);

  const goToDetails = (address, name, apr, status, nodePubKey, activeStake) => () => {
    setShowStakePage({ ...showStakePage, show: true, address: address, name: name, apr: apr, status: status, nodePubKey: nodePubKey, activeStake: activeStake });
    setShowDetails(true);
    setShowExitWithdraw(false);
    setShowRequestWithdraw(false);
    stakingStore.openedValidatorAddress = address;
  };
  const goToDetailsFromSuccessWithdraw = () => {
    setShowSuccessWithdraw(false);
    setShowExitWithdraw(false);
    setShowSuccessWithdrawFinal(false);
    setShowDetails(true);
  }

  const [loading, setLoading] = React.useState(false);
  const [showSuccessWithdraw, setShowSuccessWithdraw] = React.useState(false);
  const [showSuccessWithdrawFinal, setShowSuccessWithdrawFinal] = React.useState(false);
  const [showRequestWithdraw, setShowRequestWithdraw] = React.useState(false);
  const [showExitWithdraw, setShowExitWithdraw] = React.useState(false);

  const goToExitWithdraw = () => {
    setShowRequestWithdraw(false);
    setShowExitWithdraw(true)
  };

  const backToRequestWithdraw = () => {
    setShowExitWithdraw(false);
    setShowRequestWithdraw(true);
  }

  const goToSuccessRequestWithdrawStep = () => {
    console.log("Success Request Withdraw Step]");
    goToExitWithdraw();
    setShowExitWithdraw(true);
    setRequestWithdrawInProgress(false);
    //setValues({amountWithdraw: ''});
  }

  const goToDetailsFromExitWithdraw = () => {
    setShowExitWithdraw(false);

    setShowDetails(true);
  }
  const  getWindowDimensions = () => {
    const { innerHeight: height } = window;
    return {
      height
    };
  }
  const useWindowDimensions = () => {
    const [windowDimensions, setWindowDimensions] = useState(
      getWindowDimensions()
    );
  
    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    return windowDimensions;
  }
  const { height } = useWindowDimensions();
  const heightChange = height < 710;

  const StakePage = (props, key) => {
    const [showEpoch, setShowEpoch] = useState(false);
    const [showSort, setShowSort] = React.useState(false);
    const [sortApr, setSortApr] = React.useState({name: null});
    const [sortTotalStaked, setSortTotalStaked] = React.useState({name: null});
    const [validators, setValidators] = React.useState([]);
    const [notValidators, setNotValidators] = React.useState([]);
    const [openSearch, setOpenSearch] = useState(false);
    const [sortType, setSortType] = useLocalStorage("sortType", []);

    function useLocalStorage(key, initialValue) {
      const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === "undefined") {
          return initialValue;
        }
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          console.log(error);
          return initialValue;
        }
      });
      const setValue = (value) => {
        try {
          const valueToStore =
            value instanceof Function ? value(storedValue) : value;
          setStoredValue(valueToStore);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
        } catch (error) {
          console.log(error);
        }
      };
      return [storedValue, setValue];
    }
    const onPressReload = async () => {
      stakingStore.getValidatorsError = null;
      await stakingStore.reloadWithRetryAndCleanCache();
      setShowEpoch(false);
    }

    const handleClickEpoch = () => {
      setShowEpoch(true);
    }
    const handleClickSearch = () => {
      setOpenSearch(true);
      setShowEpoch(false);
    }
    if (showStakePage.show && !stakingStore.refresh)
      return null;

    const SearchValidator = (props) => {
      const [searchValidator, setSearchValidator] = useState('');
      const [foundValidators, setFoundValidators] = useState([]);
      const inputStyle = {
        color: '#fff',
        backgroundColor: info.app.bgSecond || '#292B52',
        paddingRight: 10,
        paddingBlock: 5,
        paddingLeft: 5,
        width: 'inherit',
        marginRight: 20
      };
      const emptyView = {
        flexDirection: 'row',
        justifyContent: 'center',
        display: "flex",
        marginTop: '30%'
      }
      const filter = (e) => {
        const keyword = e.target.value;

        if (keyword.length) {
          const results = props.filterStake.filter((item) => {
            return item.address && item.address.toUpperCase().match(keyword.toUpperCase()) || item.activeStake && item.activeStake.toString().match(keyword.toString()) || item.name && item.name.toUpperCase().match(keyword.toUpperCase()) || item.identity && item.identity.toUpperCase().match(keyword.toUpperCase());
          });
          setFoundValidators(results);
        } else {
          setOpenSearch(true)
          // setFoundValidators(props.filterStake);
        }
        setSearchValidator(keyword);
      };
      const styleRow = {
        backgroundColor: info.app.bgItem || "#1F2853", borderBottom: 1, borderBottomStyle: "solid", borderBottomColor: info.app.borderItem || '#151839', height:95, paddingBlock: 0
      }
      const searchTable = {
        overflow: 'scroll', height: 550, backgroundColor: info.app.stakingBg || "#151839", marginTop: 10
      }

      return (
        <div className="search-container" style={{marginTop: 10}}>
          <InputComponent
            lang={lang}
            info={info}
            type="search"
            style={props.style || inputStyle}
            value={searchValidator}
            onChange={filter}
            className="input-search"
            placeholder={lang.search || "Search.."}
            search
            onClose={() => setOpenSearch(false)}
          />
          {!searchValidator ? null : (
              foundValidators && foundValidators.length > 0 ? (
                <div style={searchTable} className="search-table">
                  {(foundValidators || []).map((item) => (
                    <StakeItem
                      key={item.address}
                      onClick={goToDetails(item.address, item.name, item.apr, item.status, item.myStake)}
                      totalStaked={item.activeStake}
                      address={item.address}
                      name={item.name}
                      myStake={item.myStake}
                      commission={item.commission}
                      apr={item.apr}
                      totalStakers={item.totalStakers}
                      status={item.status}
                      style={styleRow}
                      lang={lang}
                    />
                  ))}
                    </div>
              ) : (
                <div style={emptyView}>{lang.nothingToShow || "Nothing to see here!"}</div>
              )
          )}
        </div>
      );
    };


    const epochBlock = {
      backgroundColor: "#3e4067",
      color: '#fff',
      width: '100%',
      height: 50,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      display: "flex",
      position: 'absolute',
      zIndex: 11111,
      left: 0,
      right: 0
    }
    const btnCloseEpoch = {
      position: "absolute",
      top: 0,
      right: 0
    }
    const epochBtn = {
      color: '#fff', position: 'absolute', fontSize: 8
    }

    const selectStyle = {
      backgroundColor: 'transparent',
      color: '#fff',
      borderRadius: 5,
      padding: 5,
      borderColor: '#ffffff40',
      marginRight: 10
    }
    return (
      <Observer>
        {() => {
          let filterStake = stakingStore.getStakedValidators();
          let filterTotalStaked = stakingStore.getNotStakedValidators();

          if (sortType === 'apr') {
            filterStake = stakingStore.getStakedValidators().sort((a, b) => b.apr - a.apr)
            filterTotalStaked = stakingStore.getNotStakedValidators().sort((a, b) => b.apr - a.apr)
          }
          if (sortType === 'activeStake') {
            filterStake = stakingStore.getStakedValidators().sort((a, b) => b.myStake - a.myStake)
            filterTotalStaked = stakingStore.getNotStakedValidators().sort((a, b) => b.activeStake - a.activeStake)
          }

          const allValidators = stakingStore.getAllValidators();
          const epochInfo = stakingStore.epochInfo;
          const epoch = epochInfo && epochInfo.epoch ? epochInfo.epoch : '...';
          const _epochTime = epochInfo ? (((epochInfo.slotsInEpoch - epochInfo.slotIndex) * 0.4) / 3600) : '...';
          const epochTime = !isNaN(_epochTime) ? Math.round(_epochTime) : '...';
          const getValidatorsError = stakingStore.getValidatorsError;

          const LoaderText = ({text}) => (
            <span style={styleLoaderText}>{text}</span>
          );

          const SplittedText = ({text}) => {
            const textParts = text.split('.');

            return (
              <>
                {textParts.map((textPart, index) => (
                  <LoaderText
                    key={`${textPart} ${index.toString()}`}
                    text={textPart}
                  />
                ))}
              </>
            );
          };
          const Loading = ({text}) => {
            return (
              <Box
                sx={{
                  ...styleSpinner,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <CircularProgress color="inherit" />
                {text ? (
                  !text.includes('.') ? (
                    <LoaderText text={text} />
                  ) : (
                    <SplittedText text={text} />
                  )
                ) : null}
              </Box>
            );
          };

          if (
            !filterStake ||
            !filterTotalStaked ||
            stakingStore.isRefreshing ||
            stakingStore.isLoading
          ) {
            return <Loading text={stakingStore.loaderText} />;
          }
          
        const sections = [
          {
            title: `${lang.itemStakedTitle || 'Staked Validators'} (${((filterStake || []).length)})`,
            data: filterStake,
            id: 'staked-validators'
          },
          {
            title: `${lang.itemNotStaked || "Not Staked Validators"} (${((filterTotalStaked || []).length)})`,
            data: filterTotalStaked,
            id: 'not-staked-validators'
          },
        ];

        const styleRow = {
          backgroundColor: info.app.bgItem || "#1F2853", borderBottom: 1, borderBottomStyle: "solid", borderBottomColor: info.app.borderItem || '#151839', height:95, paddingBlock: 0
        }

        const renderSectionHeader = item => <div>{item.title}</div>

        const id = item => item.id

          const renderItems = (item) => {
            return (
            <StakeItem
              key={item.address}
              onClick={goToDetails(item.address, item.name, item.apr, item.status, item.myStake)}
              totalStaked={item.activeStake}
              address={item.address}
              name={item.name}
              myStake={item.myStake}
              commission={item.commission}
              apr={item.apr}
              totalStakers={item.totalStakers}
              status={item.status}
              style={styleRow}
              lang={lang}
            />
            )
          }

          return (
            <div>
              { getValidatorsError && !stakingStore.isLoading &&
                <Alert
                  action={
                    <IconButton color='inherit' onClick={onPressReload} id='on-press-reload'><AutorenewIcon/></IconButton>
                  }
                  severity="error"
                  id="error"
                  style={styleAlert}>
                    { 'An error occurred during fetching validators. Please try one more time...' }
                  </Alert>
              }



              <div style={{fontSize: 14, display: openSearch ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -10, paddingInline: 10, backgroundColor: info.app.stakingBg || '#14183b'}} {...props} className="index-title-row-staked">
                <div style={{display: openSearch && 'none'}}>
                  <IconButton color='inherit' onClick={onPressReload} id='on-press-reload'><CachedIcon fontSize="small" sx={{ color: '#ffffff60' }}/></IconButton>
                </div>
                <div style={{display: openSearch && 'none', marginLeft: 25}}>

                </div>
                <div style={{display: openSearch && 'none', alignItems: 'center'}}>
                <IconButton disabled style={{color: "white"}}><SortIcon/></IconButton>
                  <select onChange={(e) => setSortType(e.target.value)} style={selectStyle} value={sortType}>
                    <option value="apr" id='sort-apr' selected="selected">{lang.apr || "Apr"}</option>
                    <option value="activeStake" id='sort-active-stake'>{lang.totalStaked || "Total Staked"}</option>
                  </select>
                  <IconButton color='inherit' onClick={handleClickEpoch} id='on-click-epoch' style={{position: "relative"}}><EpochCurrent/><div style={epochBtn}>{epoch}</div></IconButton>
                  <IconButton color='inherit' onClick={handleClickSearch} id='open-search'><SearchIcon/></IconButton>
                </div>
              </div>
              {showEpoch &&
                <div style={{...epochBlock, backgroundColor: info.app.tooltipEpoch || "#3e4067"}}>
                  <div style={btnCloseEpoch}><IconButton color='inherit' onClick={() => setShowEpoch(false)} id='close-epoch'><CloseIcon fontSize="small" sx={{ color: '#ffffff' }}/></IconButton></div>
                  <div>{lang.epoch1 || "Epoch"}: #{epoch}</div>
                  <div>{lang.timeUntilEnd || "Time until end"}: {epochTime} {lang.hours || "hr"}</div>
                </div>
              }

            {openSearch ?
            <SearchValidator filterStake={allValidators}/>
            :
            <>
            <ReactSectionList
              renderSectionHeader={renderSectionHeader}
              renderItem={(item) => renderItems(item)}
              id={id}
              sections={
                !filterStake.length
                  ? [
                      {
                        title: `${lang.itemNotStaked || "Not Staked Validators"} (${((filterTotalStaked || []).length)})`,
                        data: filterTotalStaked,
                        id: 'not-staked-validators'
                      },
                    ]
                  : !filterTotalStaked.length
                  ? [
                    {
                      title: `${lang.itemStakedTitle || 'Staked Validators'} (${((filterStake || []).length)})`,
                      data: filterStake,
                      id: 'staked-validators'
                    }
                  ] : sections
              }
              keyExtractor={(item, index) => item + index}
              style={{overflow: 'scroll', height: 560, backgroundColor: info.app.stakingBg || "#151839"}}
            />
            </>
            }
            </div>
          )
        }}
      </Observer>
    )
  };

  const [showDetails, setShowDetails] = React.useState(false);
  const backDetailsPage = (address, name, apr, status, nodePubKey, activeStake) => {
    setShowDetails(false);
    stakingStore.openedValidatorAddress = null;
    setShowStakePage({ ...showStakePage, show: false, address: address, name: name, apr: apr, status: status, nodePubKey: nodePubKey, activeStake: activeStake  });
  };
  const [showStakeMore, setShowStakeMore] = React.useState(false);



  const DetailsValidator = (props) => {

    const { details } = props;
    const { address, activeStake, apr, name, nodePubKey, show, status } = details;
    const [ copy, setCopy ] = React.useState(false);
    if (!showDetails || !stakingStore.openedValidatorAddress) return null;

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



    if (!stakingStore.openedValidatorAddress || !details) {
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

          const chosenValidator = stakingStore.getValidatorDetails();
          if (!chosenValidator){
            return (
              <>
                <div className="staking index-container-details" style={widthContainer}>
                  <Alert
                    action={
                      <IconButton color='inherit' onClick={onPressReload2} id='on-press-reload2'><AutorenewIcon/></IconButton>
                    }
                    severity="error"
                    id="error" style={styleAlert}>
                      Oops. An error occurred. Please try again.
                  </Alert>
                </div>
              </>
            )
          }

          const TOTAL_STAKE =
              chosenValidator.totalAvailableForWithdrawRequestStake &&
              formatAmount(chosenValidator.totalAvailableForWithdrawRequestStake);
          const ADDRESS = chosenValidator.address;

          const onPressWithdraw = async () => {
            if (!chosenValidator || !chosenValidator.availableWithdrawRequested) return;
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
              const result1 = await stakingStore.reloadWithRetryAndCleanCache();
            } catch (err) {
              setWithdrawInProgress(false);
              const msg = ErrorParser.parse(err);
              setWithdrawError(msg)
              return;
            }
            setShowDetails(false);
            setShowSuccessWithdraw(true);
            setWithdrawInProgress(false);
          }
          const onPressReload = async () => {
            await stakingStore.reloadWithRetryAndCleanCache();
          }

          const goToStake = () => {
            setShowDetails(false);
            setShowStakeMore(true);
          };

          const address = chosenValidator ? chosenValidator.address : '...';
          const myStake = chosenValidator ? chosenValidator.myStake : new BN(0);
          const activeStake = chosenValidator ? chosenValidator.activeStake : new BN(0);
          const name = chosenValidator ? chosenValidator.name : '...';
          const commission = chosenValidator ? chosenValidator.commission : '...';
          const dominance = chosenValidator ? chosenValidator.dominance : new BN(0);
          const apr = chosenValidator ? ((chosenValidator.apr || 0) * 100).toFixed(2) : 0;
          const myActiveStake = chosenValidator && chosenValidator.myActiveStake ? chosenValidator.myActiveStake : '0';

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
                <Header onClickBack={backDetailsPage} onClickReload={onPressReload} onClickExplorer={onClickExplorer}/>
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
                    validatorDetails={chosenValidator}
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

  //Request Withdraw End
  const RequestWithdraw = (props) => {
    const [values, setValues] = React.useState({
      amountWithdraw: '',
    });

    const { stakingStore } = props;
    const details = stakingStore.getValidatorDetails();
    if (!details) return null;
    const { myStake,  availableWithdrawRequested }  = details;
    const TOTAL_STAKE = details.totalAvailableForWithdrawRequestStake;
    const ADDRESS = details.address;

    //Request Withdraw Start
    const onPressRequestWithdraw = async () => {
      if (!details || !details.availableWithdrawRequested) return;
      const amountWithdraw = values.amountWithdraw;
      if (!amountWithdraw || (amountWithdraw || "").trim().length === 0) return;
      if (parseFloat(amountWithdraw) > parseFloat(TOTAL_STAKE)) return;
      setRequestWithdrawInProgress(true);

      try {
        const result = await stakingStore.requestWithdraw(
          ADDRESS,
          amountWithdraw
        );
        if (result.error) {
          setRequestWithdrawInProgress(false);
          if (result.code && result.code === WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE) {
            setShowSuccessWithdrawFinal(true);
            return setRequestWithdrawInProgress(false);
          }

          const result1 = await stakingStore.reloadWithRetryAndCleanCache();

          const errMessage = ErrorParser.parse(result.error);
          return setWithdrawError(errMessage);
        }
      } catch (err) {
        setRequestWithdrawInProgress(false);
        const errMessage = ErrorParser.parse(err);
        setWithdrawError(errMessage)
        setTimeout(() => {
          setWithdrawError(null)
        }, 3000);
        console.error(err);
        return;
      }
      goToExitWithdraw();
      setShowExitWithdraw(true);
      setRequestWithdrawInProgress(false);
      setValues({amountWithdraw: ''});

    };

    const backToDetailsFrowWithdraw = () => {
      setShowRequestWithdraw(false);
      setShowDetails(true);
    };


    const handleChange = (text) => {
      setValues({ ...values, amountWithdraw: text });
    };

    const styleAlert = {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      zIndex: 99,
      padding:10,
      borderRadius: 0
    }
    const popupContainer = {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      zIndex: 999,
      padding:10,
      borderRadius: 0
    }
    const withdrawDisabled = !values.amountWithdraw || (amountToBN(values.amountWithdraw+"").gt(TOTAL_STAKE)) || values.amountWithdraw == 0

    const onClickMax = (text) => {
      setValues({ ...values, amountWithdraw: formatAmount(TOTAL_STAKE)});
    }
    return (
      <>
      {showRequestWithdraw && (
        <>
          <Loader
            show={requestWithdrawInProgress}
            text={lang.progressWithdraw || 'Withdrawing in process...'}
            info={info}
          />
          <div className="staking requestWithdraw index-width-container" style={widthContainer}>
            {withdrawError &&
              <Alert
                severity="error"
                id="error"
                style={styleAlert}
                onClose={() => {setWithdrawError(null)}}
              >
                  { withdrawError }
              </Alert>}
            <Header onClickBack={backToDetailsFrowWithdraw}/>
            <InputComponent lang={lang}
              value={values.amountWithdraw}
              onChange={(text) => handleChange(text)}
              maxValue={TOTAL_STAKE}
              maxValueText={lang.yourTotalStake || 'Your total stake'}
              onClickMax={onClickMax}
              info={info}
            />
          {(amountToBN(values.amountWithdraw+"").gt(TOTAL_STAKE)) &&
            <Notice mt={20} text={lang.noticeTrying || "You are trying to withdraw more funds than you have."}/>
          }
            <ButtonBlock lang={lang} withdrawDisabled={withdrawDisabled} text={lang.withdraw1 || "WITHDRAW"} onClickWithdrawal={onPressRequestWithdraw} />
          </div>
        </>
      )}
      {showExitWithdraw && (
        <div className="staking index-width-container" style={widthContainer}>
          <Header onClickBack={backToRequestWithdraw}/>
        <Enterance lang={lang} exitValidatorImg title={lang.exitValidatorTitle || 'Withdrawal request has been submitted successfully'} subtitle={lang.exitValidatorSubTitle || 'It will start cooling down from the next epoch. Please navigate the withdrawals tab to monitor the progress.'}/>
        <ButtonBlock lang={lang} text={lang.ok || "Ok"} onClickNext={goToDetailsFromExitWithdraw}/>
        </div>
      )}
      </>
    );
  }

  const Loading = () => {
    return (
      <Box sx={styleSpinner}>
      <CircularProgress color='inherit'/>
    </Box>
    )
  }
  const gotoSuccessWithdrawStep = () => {
      stakingStore.txsProgress = new Array(20).fill({state:""});;
      setShowSuccessWithdraw(true);
      return true;
  };
  return (
    <div className="staking index-width-container full-width" style={widthContainer}>
     {loading ? <Loading/> :
        <Box sx={{...style, backgroundColor: info.app.stakingBg || "#151839"}} className={heightChange ? !showStakePage.show ? "index-style-box-size" : "style-container-size" : !showStakePage.show ? "index-style-box" : "style-container"}>
          <StakePage />
          { stakingStore.openedValidatorAddress && showDetails &&
            <DetailsValidator details={showStakePage}/>
          }
          { stakingStore.openedValidatorAddress && (
            <>
              {showRequestWithdraw &&
                <RequestWithdraw
                  stakingStore={stakingStore}
                />
              }
              <Stake
                stakingStore={stakingStore}
                setShowStakeMore={setShowStakeMore}
                setShowDetails={setShowDetails}
                showStakeMore={showStakeMore}
                lang={lang}
                info={info}
              />
            </>
          )}
          {showSuccessWithdraw && stakingStore.txsProgress && (stakingStore.txsProgress.filter(it => it.transaction).length <= 1) && (
            <div className="staking success-withdraw index-width-container" style={{...widthContainer2, backgroundColor: info.app.stakingBg || "#161a42"}}>
              <Enterance lang={lang} exitValidatorImg title={lang.withdrawalSuccessfully || 'Withdrawal has been submitted successfully'} subtitle={lang.withdrawalSuccessfullySub || 'It make take a few minutes to appear on your balance.'}/>
              <ButtonBlock lang={lang} text={lang.ok || "Ok"} onClickNext={goToDetailsFromSuccessWithdraw}/>
            </div>
          )}
          {stakingStore.openedValidatorAddress && showExitWithdraw && (
            <div className="staking index-width-container" style={widthContainer}>
              <Header/>
              <Enterance lang={lang} exitValidatorImg title={lang.exitValidatorTitle || 'Withdrawal request has been submitted successfully'} subtitle={lang.exitValidatorSubTitle || 'It will start cooling down from the next epoch. Please navigate the withdrawals tab to monitor the progress.'}/>
              <ButtonBlock lang={lang} text={lang.ok || "Ok"} onClickNext={goToDetailsFromExitWithdraw}/>
            </div>
          )}
          <Observer>
            {() => {
              return (
                <>
                {stakingStore.txsProgress.filter(it => it.transaction).length > 0 && showSuccessWithdrawFinal && (
                  <TransactionsProgress
                    transactions={stakingStore.txsProgress}
                    stakingStore={stakingStore}
                    gotoSuccessWithdrawStep={gotoSuccessWithdrawStep}
                    goToDetailsFromSuccessWithdraw={goToDetailsFromSuccessWithdraw}
                    setShowSuccessWithdraw={setShowSuccessWithdraw}
                    showSuccessWithdraw={showSuccessWithdraw}
                    showExitWithdraw={showExitWithdraw}
                    goToSuccessRequestWithdrawStep={goToSuccessRequestWithdrawStep}
                    setShowSuccessWithdrawFinal={setShowSuccessWithdrawFinal}
                    lang={lang}
                  />
                )}
                </>
              )
            }}
          </Observer>
        </Box>
     }
    </div>
  );
};

// module.exports = StakingPage;
export default StakingPage;
