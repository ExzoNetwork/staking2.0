import * as React from 'react';
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import IconButton from '@mui/material/IconButton';
import CachedIcon from '@mui/icons-material/Cached';
import LaunchIcon from '@mui/icons-material/Launch';
const Header = (props) => {
    const container = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -5,
    }
  return (
      <>
      <div style={container} className="header-container">
        {props.onClickBack &&
        <div>
          <IconButton color='inherit' onClick={props.onClickBack} id='click-back'><ArrowBackIos/></IconButton>
        </div>
        }
         {props.onClickReload && 
        <div>
          <IconButton color='inherit' onClick={props.onClickReload} id='click-reload'><CachedIcon fontSize="small" sx={{ color: '#ffffff60' }}/></IconButton>
        </div>
        }
        {props.onClickExplorer && 
        <div>
          <IconButton color='inherit' onClick={props.onClickExplorer} id='click-explorer'><LaunchIcon sx={{ color: '#0bffb7' }}/></IconButton>
        </div>
        }
      </div>
    </>
  );
}

export default Header;
