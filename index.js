import React from 'react';
import ReactDOM from 'react-dom';
import {StakingPage} from './src/index'
import './app.css';
import './reset.css';


const appRoot = document.createElement('div');


appRoot.id = 'staking';
document.body.appendChild(appRoot);
ReactDOM.render(<React.StrictMode><StakingPage /></React.StrictMode>, appRoot);
