import React from 'react';

const Badge = (props) => {
  const {status, lang} = props;
  const typeBadge = (type) => {
    switch (type) {
      case 'active':
        return lang.badgeActive || 'Active';
      case 'inactive':
        return lang.badgeInactive || 'Inactive';
      default:
        return null;
    }
  };
  const checkStatus = status === 'active';
  return (
    <div id={checkStatus ? 'active-status' : 'inactive-status'} style={{background: checkStatus ? '#0BFFB7' : "gray", color: checkStatus ? 'black' : "white", width: "fit-content", borderRadius: 20, paddingInline: 5, textTransform: "capitalize", fontSize: 11, marginTop: props.top, marginBottom: props.bottom, minWidth: 40, textAlign: "center"}}>
      {typeBadge(props.status)}
    </div>
  );
};

export default Badge;
