import * as React from 'react';
import NoticeIcon from './images/notice-icon';

const Notice = (props) => {
  const container = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: props.mt
  };
  const title = {
    fontSize: 16,
    flex: 0.85,
    textAlign: 'left',
  };
  const icon = {
    flex: 0.1,
  };
  return (
    <div style={container} className="notice-container">
      <div style={icon} className="notice-icon">
        <NoticeIcon width="34" height="35" />
      </div>
      <div style={title} className="notice-title">{props.text}</div>
    </div>
  );
};

export default Notice;
