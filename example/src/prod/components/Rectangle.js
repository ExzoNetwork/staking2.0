import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

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

export default Rectangle;
