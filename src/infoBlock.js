import React from 'react';
import ContentCopy from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const BORDER_COLOR = 'rgba(255, 255, 255, 0.18)';
const GRAY_COLOR = 'rgba(255, 255, 255, 0.50)';
const content = {
  alignItems: 'center',
  marginTop: 20,
};
const addressStyle = {
  color: '#fff',
  fontSize: 13,
  marginHorizontal: 30,
  textAlign: 'center',
  marginTop: 10,
};
const row = {
  marginTop: 10,
//   marginInline : 20,
display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 10,
  borderTopWidth: 0.5,
  borderTopColor: BORDER_COLOR,
  borderTopStyle: 'solid',
  borderBottomWidth: 0.5,
  borderBottomColor: BORDER_COLOR,
  borderBottomStyle: 'solid',

};
const column = {
  flex: 0.5,
  maxHeight: 'auto',
  justifyContent: 'center',
  alignItems: 'center',
  display: 'flex',
  flexDirection: "column",
  marginBlock: 12,
  position: 'relative',
};
const column2 = {
  flex: 0.5,
  maxHeight: 'auto',
  justifyContent: 'center',
  alignItems: 'center',
  borderLeftWidth: 0.5,
  borderLeftColor: BORDER_COLOR,
  borderLeftStyle: 'solid',
  display: 'flex',
  flexDirection: "column",
  marginBlock: 12,
  position: 'relative',
};
const value = {
  color: '#fff',
  fontSize: 14,
  textAlign: 'center',
};
const subtitle = {
  color: GRAY_COLOR,
  fontSize: 11,
  textTransform: 'uppercase',
  marginTop: 10,
};

const link_active_stake = 'https://support.velas.com/hc/en-150/articles/360021044820-Delegation-Warmup-and-Cooldown';
const Info = (props) => {
  const {lang} = props;
  return (
    <Tooltip
    enterTouchDelay={0}
    title={<div>{props.titleInfo} {props.link && <a href={link_active_stake} target="_blank" id='link' style={{color: '#0BFFB7', cursor: 'pointer', textDecoration: 'underline',}}>
        {lang.read || "Read More"}.
      </a>}</div>}
    style={{position: 'absolute', top: -10, right: 5}}
    >
    <IconButton>
      <InfoIcon color='inherit' style={{color: "#FFF", fontSize: 10, }} id='info-btn'/>
    </IconButton>
  </Tooltip>
  )
}

const InfoBlock = (props) => {
  const {lang} = props;
  return (
    <div>
      <div style={content} className="info-block-content">
        {props.name && (
          <div style={addressStyle} className="info-block-address-style" onClick={props.copyName} id='info-block-name'>
            {props.name}
          </div>
        )}
        <div
          style={{
            color: props.name ? 'rgba(255, 255, 255, 0.3)' : '#fff',
            fontSize: 12,
            marginHorizontal: 30,
            marginBlock: 20,
            textAlign: 'center',
            marginTop: 10,
            cursor: "pointer"
          }}
          className="info-block-address"
          onClick={props.copyAddress} id='info-block-address'>
          {props.address} <ContentCopy fontSize='15'/>
        </div>
      </div>
      <div style={row} className="info-block-row">
          <div style={column} className="info-block-column">
            {props.titleInfo && <Info {...props} lang={lang}/>}
            <div style={value} className="info-block-value" id='value2'>{props.value2}</div>
            <div style={subtitle} className="info-block-subtitle">{props.subtitle2}</div>
          </div>
          <div style={column2} className="info-block-column2">
            {props.tooltip1 && <Info titleInfo={props.tooltip1} lang={lang}/>}
            <div style={value} className="info-block-value" id='value1'>{props.value1}</div>
            <div style={subtitle} className="info-block-subtitle">{props.subtitle1}</div>
          </div>
      </div>
    </div>
  );
};

export default InfoBlock;
