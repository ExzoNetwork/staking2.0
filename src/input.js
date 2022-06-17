import * as React from 'react';
import Input from '@mui/material/Input';
import InputAmount from './inputAmount';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import {formatStakeAmount} from './format-value';
import SortIcon from '@mui/icons-material/Sort';
import Button from '@mui/material/Button';
import VelasIcon from './images/velas-blue';
import IconButton from '@mui/material/IconButton';

const InputValue = (props) => {
  const { maxValue, type, onClickMax, lang, info, maxFractionLength } = props;
  const max_value = formatStakeAmount(maxValue || null, {decimals: true});
  console.log("input maxFractionLength", maxFractionLength)

  const styleh3 = {
    color: '#fff',
    fontSize: 18,
    marginBlock: 10,
    textAlign: 'left',
  };
  const inputStyle = {
    color: '#fff',
    backgroundColor: '#292B52',
    paddingRight: 10,
    paddingBlock: 5,
    paddingLeft: 5,
  };
  const closeBtn = {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    color: "#fff",
    fontSize: 12
  }
  const styleUseMax = {
    fontSize: 10,
    paddingBlock: 5,
    paddingInline: 10,
    backgroundColor: '#30349E',
    borderRadius: 10,
    textDecoration: 'underline',
    color: '#fff'
  }

  return (
    <div>
      {props.search ? (
        <FormControl fullWidth variant="standard" style={{flexDirection: "inherit"}}>
          <Input
            onChange={props.onChange}
            placeholder={props.placeholder}
            style={props.style || inputStyle}
            className="input-field"
            value={props.value}
            type={props.type}
            disableUnderline
            autoFocus
          />
          <Button size="small" style={closeBtn} onClick={props.onClose} id='on-close'>
            {lang.cancel || "Cancel"}
          </Button>
        </FormControl>
      ) : (
        <FormControl fullWidth sx={{mt: 1}} variant="standard">
          <h3 style={styleh3} className="input-styleh3">
            {lang.enterAmount || "Enter Amount"}
          </h3>
          <InputAmount
            id="filled-adornment-amount"
            type={props.type || "text"}
            value={props.value}
            onChangeText={props.onChange}
            placeholder="0.00"
            maxFractionLength={maxFractionLength}
            style={{
              color: '#fff',
              backgroundColor: info.app.bgSecond || '#292B52',
              paddingRight: 10,
              paddingBlock: 5,
              paddingLeft: 5,
            }}
            className="input-field"
            endAdornment={
              <InputAdornment position="end">
            <IconButton onClick={onClickMax} id='on-click-max' style={{...styleUseMax, backgroundColor: info.app.bgItem || "#30349E"}}>{lang.useMax1 || "Use max"}</IconButton>
            </InputAdornment>
            }
          />
          <FormHelperText
            id="standard-weight-helper-text"
            style={{color: '#fff'}}
            className="input-subtitle">
            {props.maxValueText || (lang.availableStaking || 'Available for staking')}: {max_value} VLX
          </FormHelperText>
        </FormControl>
      )}
    </div>
  );
};

export default InputValue;
