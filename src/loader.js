import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const styleSpinner = {
  top: '48%',
  position: "absolute",
  left: '48%',
  color: "#fff",
  left: 0,
  right: 0,
  textAlign: 'center'
}
const containerStyle = {
  position: 'absolute',
  zIndex: 999,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#151839",
}
const msgStyle = {
  marginBottom: 20
}

const Loader = (props) => {

  const { text, show, info } = props;

  if (!show) return null;
  return (
    <div class={"ss"} style={{...containerStyle, backgroundColor: info.app.stakingBg || "#151839"}}>
      <Box sx={styleSpinner}>
        <div style={msgStyle}>{text || ""}</div>
        <CircularProgress color='inherit'/>
      </Box>
    </div>
  )
}

export default Loader;
