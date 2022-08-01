import React, { useEffect, useState } from "react";
import Jdenticon from 'react-jdenticon';
import Badge from './badge'
import BN from 'bn.js';
import { formatStakeAmount, formatToFixed } from './format-value';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

function getWindowDimensions() {
    const { innerWidth: width } = window;
    return {
      width
    };
  }
  function useWindowDimensions() {
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

const StakeItem = (props) => {
  const { width } = useWindowDimensions();
  const { lang } = props;
  var address = props.address;
  const addressCut = address.substring(0, 15) + '...' + address.substring(35);
  const isStaked = props.myStake > 0 ? true : false;
  const cssStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBlock: 2,
    fontSize: 12,
  }

  return (
    <List sx={{ width: '100%', cursor: "pointer"}} style={{...props.style, height: props.name ? 100 : 95}}>
      <ListItemButton onClick={props.onClick} id='on-click-validator'>
        <ListItemAvatar>
        <Jdenticon size="40" value={props.address} />
        </ListItemAvatar>
        <div style={{display: 'flex', justifyContent: 'center',  width: '100%', fontSize: 12}}>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBlock: 5}}>
                <div id='address-validator' style={{marginTop: 2, color: props.name ? 'rgba(255,255,255,0.50)' : '#fff', fontSize: 12}}>{width < 750 ? addressCut : address}</div>
                {props.name && <div id='name-validator' style={cssStyle}>{props.name}</div>}
                <div style={{marginTop: 6, color: 'rgba(255,255,255,0.50)', fontSize: 10}}>{isStaked ? lang.myStake1 || "My Stake" : lang.totalStaked || "Total Staked"}</div>
                <div id={isStaked ? 'my-stake-validator' : 'total-staked-validator'}  style={{marginBlock: 2, color: isStaked ? '#0BFFB7' : "#fff"}}> {isStaked ? formatStakeAmount(props.myStake) : formatStakeAmount(props.totalStaked)}{' '}VLX</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBlock: 5}}>
                <div style={{marginTop: 6}}><Badge status={props.status} lang={lang}/></div>
                <div style={{height: 10}}/>
                <div style={{marginTop: 6, color: 'rgba(255,255,255,0.50)', fontSize: 10}}>APR,%</div>
                <div id='apr-validator' style={{marginBlock: 2}}>{null !== props.apr && formatToFixed(props.apr * 100)}</div>
            </div>
        </div>
        </ListItemButton>
      </List>
  );
};

export default StakeItem;
