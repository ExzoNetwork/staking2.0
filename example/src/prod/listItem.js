import * as React from 'react';
import Jdenticon from 'react-jdenticon';
import Badge from './badge'
import BN from 'bn.js';
import { formatStakeAmount, formatToFixed } from './format-value';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

const Item = (props) => {
  var address = props.address;
  const addressCut = address.substring(0, 15) + '...' + address.substring(25);

  const styleRow = {
    color: "#fff",
    borderColor: props.staked ? "#04051b" : "#151839",
    cursor: "pointer",
    fontSize: 12,
    backgroundColor: props.staked ? '#1F2853' : '#080e35'
  }
  return (
    <TableRow
      key={props.address}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      onClick={props.onClick}
      id='table-row-click'
    >
    <TableCell style={styleRow} className="style-row"><Jdenticon size="40" value={props.address} /></TableCell>
      <TableCell component="th" scope="item"  style={styleRow} className="style-row">
        {addressCut}
        <div style={{color: 'rgba(255, 255, 255, 0.3)'}}>{props.name}</div>
      </TableCell>
      <TableCell align="right" style={styleRow} className="style-row">{props.commission}</TableCell>
      {props.myStake && <TableCell align="right" style={{...styleRow, color: props.staked && '#0BFFB7'}} className="style-row">{formatStakeAmount(props.myStake)}</TableCell>}
      {props.totalStaked && <TableCell align="right" style={styleRow} className="style-row">{formatStakeAmount(props.totalStaked)}</TableCell>}
      <TableCell align="right" style={styleRow} className="style-row">{null !== props.apr && formatToFixed(props.apr * 100)}</TableCell>
      <TableCell align="right" style={styleRow} className="style-row">{props.totalStakers}</TableCell>
      <TableCell align="right" style={styleRow} className="style-row"><Badge status={props.status}/></TableCell>
    </TableRow>
  );
};

export default Item;