import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ButtonBlock from './buttonBlock';
import FlatList from 'flatlist-react';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { formatStakeAmount, formatReward, formatToFixed } from './format-value';
import { Observer } from 'mobx-react';
import DominanceIcon from './images/dominance-icon';
import PercentIcon from './images/percent-icon';
import PlusIcon from './images/plus-icon';
import StakeIcon from './images/stake-icon';
import WithdrawalsIcon from './images/withdrawal-icon';
import VelasIcon from './images/velas-blue';

function TabPanel(props) {
  const {children, value, index, lang, ...other} = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <div style={{marginBlock: 10}}>{children}</div>}
    </div>
  );
}

const Rectangle = (props) => {
  const mb = {
    marginBlock: 5,
    minHeight: 10,
    fontSize: 12,
    textTransform: 'uppercase',
  };
  const link_active_stake = 'https://support.velas.com/hc/en-150/articles/360021044820-Delegation-Warmup-and-Cooldown';

  const Info = (props) => {
    const {lang, info} = props;
    return (
      <Tooltip
      enterTouchDelay={0}
      title={<div>{props.titleInfo} {props.link && <a href={link_active_stake} id='link' target="_blank" style={{color: '#0BFFB7', cursor: 'pointer', textDecoration: 'underline',}}>
          {lang.read || "Read More"}.
        </a>}</div>}
      style={{position: 'absolute', top: 5, right: 5}}
      >
      <IconButton>
        <InfoIcon color='inherit' style={{color: "#FFF", fontSize: 10, }} id='info-btn'/>
      </IconButton>
    </Tooltip>
    )
  }
  return (
    <div style={props.style}>
      {props.titleInfo && <Info {...props}/>}
      <div style={mb}>{props.row1}</div>
      <div style={mb} id={props.id}>{props.row2}</div>
      <div style={{...mb, fontSize: 10, color: '#ffffff80'}}>{props.row3}</div>
    </div>
  );
};
const leftRectangle = {
  backgroundColor: '#1a1f4f',
  width: 190,
  marginRight: 5,
  textAlign: 'center',
  padding: 10,
  position: "relative"
};
const rightRectangle = {
  backgroundColor: '#1a1f4f',
  width: 190,
  marginLeft: 5,
  textAlign: 'center',
  padding: 10,
  position: "relative"
};
const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

/**
  * First validator details screen
  */
function BlockStake(props) {
  const { validatorDetails, stakingStore, lang, info } = props;
  if (!validatorDetails) return null;
  const { myStake, availableWithdrawRequested, myActiveStake, annualPercentageRate, dominance, quality, totalAvailableForWithdrawRequestStake } = validatorDetails;
  const ownActiveStake = myActiveStake || '...';

  const activateButtons = validatorDetails.stakeDataIsLoaded;
  const buttonsStyle = activateButtons ? styles.styleBtnGreen : styles.styleBtnDisabled;
  const stakeClick = () => {
    if (!validatorDetails.stakeDataIsLoaded) return;
    props.onClickStake();
  }
  const requestBtnStyle = activateButtons ? styles.styleBtnRed : styles.styleBtnRequestDisabled;
  const isStakedValidator = !myStake.isZero();
  const activeStake = validatorDetails ? validatorDetails.activeStake : '0';
  const commission = validatorDetails ? validatorDetails.commission : '';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
      { isStakedValidator  ? (
        <>
          <div style={rowStyle}>
            <Rectangle
              row1={<StakeIcon width='20px' height='14px'/>}
              row2={formatStakeAmount(activeStake) + " VLX"}
              id='total-stake'
              row3={lang.totalStake1 || "Total stake"}
              style={{...leftRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
              titleInfo={lang.infoTotalStake || 'Total stake of validator'}
            />
            <Rectangle
              row1={<PercentIcon width='20px' height='14px'/>}
              row2={annualPercentageRate}
              id='apr'
              row3={lang.annual || "ANNUAL PERCENTAGE RATE"}
              style={{...rightRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
              titleInfo={lang.info3 || 'APR is calculated based on the results of the previous epoch'}
            />
          </div>
          <div style={{...rowStyle, marginTop: 20, display: 'flex'}}>
            <Rectangle
              row1={<DominanceIcon width='20px' height='14px'/>}
              row2={dominance.toFixed(4)}
              id='dominance'
              row3={lang.dominance || "Dominance"}
              style={{...leftRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
              titleInfo={lang.info1 || 'Relative validator weight compared to the average. Lower is better'}
            />
            <Rectangle
              row1={<PercentIcon width='20px' height='14px'/>}
              row2={commission}
              id='commission'
              row3={lang.validatorInterest || "Validator Interest"}
              style={{...rightRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
              titleInfo={lang.infoCommission || 'A commission that you pay to validator from each reward'}
            />
          </div>
        </>
        ) : (
          <>
            <div style={{...rowStyle, marginTop: 20, display: 'flex'}} className="containers">
              <Rectangle
                row1={<DominanceIcon width='20px' height='14px'/>}
                row2={dominance.toFixed(4)}
                id='dominance'
                row3={lang.dominance || "Dominance"}
                style={{...leftRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
                titleInfo={lang.info1 || 'Relative validator weight compared to the average. Lower is better'}
              />
              <Rectangle
                row1={<PercentIcon width='20px' height='14px'/>}
                row2={commission}
                id='commission'
                row3={lang.validatorInterest || "Validator Interest"}
                style={{...rightRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
                titleInfo={lang.infoCommission || 'A commission that you pay to validator from each reward'}
              />
            </div>
          </>
        )
      }
      <div style={{textAlign: 'center'}} className="button-block-style">
        {
          myActiveStake ? (
            <button
              onClick={props.onClickStakeMore}
              id='on-click-stake-more'
              style={buttonsStyle} className="button-block-style-btn-green">
              {lang.stakeMore1 || "Stake More"}
            </button>
          ) :
          (
            <button
              onClick={stakeClick}
              disabled={!validatorDetails.stakeDataIsLoaded}
              id='on-click-stake'
              style={buttonsStyle} className="button-block-style-btn-green">
              {lang.stake1 || "Stake"}
            </button>
          )
        }

        {
          myActiveStake &&
          totalAvailableForWithdrawRequestStake &&
          totalAvailableForWithdrawRequestStake.gte(stakingStore.rent) && (

            <button
              onClick={props.onClickRequest}
              id='on-click-request'
              style={styles.styleBtnRed} className="button-block-style-btn-red">
              {lang.requestWithdraw || "REQUEST WITHDRAW"}
            </button>
          )
        }
      </div>
    </div>
  );
}

const styles = {
  styleBtnDisabled: {
    background: '#0BFFB7',
    padding: 12,
    width: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    fontSize: 12,
    opacity: 0.2
  },
  styleBtnGreen:{
    background: '#0BFFB7',
    padding: 12,
    width: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    fontSize: 12,
  },
  styleBtnRequestDisabled:{
    background: '#FB5252',
    padding: 12,
    width: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    color: "#fff",
    fontSize: 12,
    opacity: 0.2
  },
  styleBtnRed: {
    background: '#FB5252',
    padding: 12,
    width: 180,
    cursor: 'pointer',
    border: 'none',
    textTransform: "uppercase",
    marginBlock: 20,
    marginInline: 10,
    color: "#fff",
    fontSize: 12,
  },
}


function BlockWithdrawals(props) {
  const { validatorDetails, lang, info } = props;
  const { totalWithdrawRequested, availableWithdrawRequested } = validatorDetails;
  const totalWithdRequested = totalWithdrawRequested ? (totalWithdrawRequested && totalWithdrawRequested.isZero() ? '0' : formatStakeAmount(totalWithdrawRequested)) : '...';
  const totalWithdrawRequestedSign = totalWithdrawRequested ? (totalWithdrawRequested.isZero() ? '' : '') : ''
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Rectangle
          row1={<VelasIcon width='23px' height='19px'/>}
          row2={totalWithdRequested}
          id='total-withdraw-requested'
          row3={lang.totalWithdraw || "TOTAL WITHDRAW REQUESTED"}
          style={{...leftRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
          titleInfo={''}
        />
        <Rectangle
          row1={<VelasIcon width='23px' height='19px'/>}
          row2={formatStakeAmount(availableWithdrawRequested)}
          row3={lang.availableWithdraw || "AVAILABLE FOR WITHDRAW"}
          id='available-withdraw'
          style={{...rightRectangle, backgroundColor: info.app.bgItem || '#1a1f4f'}}
          titleInfo={''}
        />
      </div>
      {!availableWithdrawRequested ||
        availableWithdrawRequested.isZero() ? null : (
              <ButtonBlock lang={lang} onClickWithdrawal={props.onClickWithdrawal} id='on-click-withdrawal'/>
      )}
    </div>
  );
}


function Rewards(props) {
  const { stakingStore, lang, info } = props;

  React.useEffect(() => {
    const loadRewards = async () => {
      try {
        await stakingStore.loadMoreRewards();
      } catch (error) {
        console.log('stakingStore.loadMoreRewards error: ', error);
      }
    };

    loadRewards();
  }, []);

  const tableRow = {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    display: 'flex',
  };
  const columnRowTxt = {
    width: '33.3%',
    textAlign: 'center',
    color: '#fff',
    borderWidth: 2,
    borderColor: '#151839',
    borderStyle: 'solid',
    padding: 7,
    fontSize: 12,
  };
  const tabRowTxt = {
    width: '33.3%',
    textAlign: 'center',
    color: '#ffffff20',
    fontSize: 12,
  };
  const styleFlatList = {
    overflowY: 'scroll',
    height: 240,
  };
  const renderItem = (item, idx) => {
    const amount = item.amount ? formatReward(item.amount) : '...';
    const apr = item.apr ? formatToFixed(item.apr * 100) : '...';

    return (
      <div key={item.epoch} style={tableRow} className="tabs-container-tablerow" id='reward-item'>
        <div
          style={{
            ...columnRowTxt,
            backgroundColor: idx % 2 == 1 ? info.app.bgItem || '#252847' : info.app.bgSecond || '#161A3F',
            borderColor: info.app.borderItem || '#151839',
          }} className="tabs-container-columnrowtxt">
          {!item.epoch ? '...' : item.epoch}
        </div>
        <div
          style={{
            ...columnRowTxt,
            backgroundColor: idx % 2 == 1 ? info.app.bgItem || '#252847' : info.app.bgSecond || '#161A3F',
            borderColor: info.app.borderItem || '#151839',
          }} className="tabs-container-columnrowtxt">
          {amount}
        </div>
        <div
          style={{
            ...columnRowTxt,
            backgroundColor: idx % 2 == 1 ? info.app.bgItem || '#252847' : info.app.bgSecond || '#161A3F',
            borderColor: info.app.borderItem || '#151839',
          }} className="tabs-container-columnrowtxt">
          {apr}
        </div>
      </div>
    );
  };
  const link_reward = 'https://support.velas.com/hc/en-150/articles/360021071360-How-To-Delegate-Undelegate-and-Claim-the-Rewards-Using-UI-Wallet';

  const EmptyList = (props) => {
    const {lang} = props;
    const styleEmpty = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      marginBlock: 80,
    };
    return (
      <div style={styleEmpty} className="tabs-container-style-empty">
        <div style={{marginBlock: 10, fontSize: 12}} className="tabs-container-empty-title">
          {lang.rewardsEmptyTitle || "We did not find any reward records for this validator."}
        </div>
        <div style={{fontSize: 12}}>
          {lang.rewardsEmptyText || "Read about how rewards are"}{' '}
          <a
            href={link_reward}
            target="_blank"
            id='link-reward'
            style={{
              color: '#0BFFB7',
              cursor: 'pointer',
              textDecoration: 'underline',
            }} className="tabs-container-empty-link">
            {lang.rewardsEmptyLink || "getting credited."}
          </a>
        </div>
      </div>
    );
  };

  return (
    <Observer>
      {() => {
        const rewards = stakingStore.getRewards().rewards;
        return (
          <>
            <div style={{...tableRow, height: 25, alignItems: 'flex-start'}} className="tabs-container-tablerow">
              <div style={tabRowTxt} className="tabs-container-tab-row-txt">{"#"}{lang.epoch1 || "Epoch"}</div>
              <div style={tabRowTxt} className="tabs-container-tab-row-txt">{lang.reward || "Reward"}</div>
              <div style={tabRowTxt} className="tabs-container-tab-row-txt">{lang.apr || "APR"}</div>
            </div>
            <div style={styleFlatList} className="tabs-container-style-flat-list">
              <FlatList
                list={rewards}
                renderItem={renderItem}
                renderWhenEmpty={() => <EmptyList lang={lang}/>}
              />
            </div>
          </>
        )
      }}
    </Observer>
  );
}

const TabsContainer = (props) => {
  const {lang, info} = props;
  const [value, setValue] = React.useState(0);
  if (!props.validatorDetails) return null;
  const { myStake } = props.validatorDetails;
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const BORDER_COLOR = 'rgba(255, 255, 255, 0.18)';

  return (
    <Box sx={{width: '100%'}}>
      { !myStake.isZero() &&
        <Box sx={{borderBottom: 1, borderColor: BORDER_COLOR}}>
          <Tabs
            value={value}
            onChange={handleChange}
            TabIndicatorProps={{style: {background: '#0BFFB7'}}}
            variant="fullWidth"
            centered
            textColor={'inherit'}>
            <Tab
              label={lang.stake1 || "Stake"}
              id='tab-stake'
              style={{
                color: value === 0 ? '#0BFFB7' : '#ffffff20',
                fontSize: 13
              }}
              className="tabs-container-tab"
            />
            <Tab
              label={lang.tabWithdrawals || "Withdrawals"}
              id='tab-withdrawals'
              style={{
                color: value === 1 ? '#0BFFB7' : '#ffffff20',
                fontSize: 13
              }}
              className="tabs-container-tab"
            />
            <Tab
              label={lang.tabRewards || "Rewards"}
              id='tab-rewards'
              style={{
                color: value === 2 ? '#0BFFB7' : '#ffffff20',
                fontSize: 13
              }}
              className="tabs-container-tab"
            />
          </Tabs>
        </Box>
      }
      { !myStake.isZero() ?
        <>
          <TabPanel value={value} index={0}>
            <BlockStake {...props} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <BlockWithdrawals {...props} />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <Rewards
              stakingStore={props.stakingStore}
              lang={lang}
              info={info}
            />
          </TabPanel>
        </>
        :
        <TabPanel value={value} index={0}>
          <BlockStake {...props} />
        </TabPanel>
      }
    </Box>
  );
};

export default TabsContainer;