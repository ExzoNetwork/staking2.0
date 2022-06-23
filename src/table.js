import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ReactSectionList from './reactSectionList';

const styleHead = {
  color: '#fff',
  backgroundColor: '#04051b',
  borderWidth: 0,
  fontSize: 12,
  height: 35
};

const TableValidators = ({children, ...props}) => {
  return (
    <TableContainer
      component={Paper}
      style={{height: props.staked ? 200 : props.search ? 540 : 280, backgroundColor: '#1d224e'}}>
      <Table
        size={'small'}
        stickyHeader
        aria-label="sticky table"
        sx={{minWidth: 650, backgroundColor: '#1f2853'}}>
        <TableHead>
          <TableRow hover>
            <TableCell
              align="left"
              style={{...styleHead, width: 0}}
              className="style-head"
            />
            <TableCell style={styleHead} className="style-head">
              Account
            </TableCell>
            <TableCell align="right" style={styleHead} className="style-head">
              Commission,%
            </TableCell>
            <TableCell align="right" style={styleHead} className="style-head">
              {props.staked ? 'My Stake (VLX)' : 'Total Staked (VLX)'}
            </TableCell>
            <TableCell align="right" style={styleHead} className="style-head">
              Apr,%
            </TableCell>
            <TableCell align="right" style={styleHead} className="style-head">
              Stakers
            </TableCell>
            <TableCell align="left" style={styleHead} className="style-head">
              Status
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
};
export default TableValidators;
