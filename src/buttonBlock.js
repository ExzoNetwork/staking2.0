import React from 'react';

const ButtonBlock = (props) => {
  const {stakeMoreDisabled, stakeDisabled, nextDisabled, withdrawDisabled, lang} = props;
  const styleBtnGreen = {
      background: '#0BFFB7',
      padding: 12,
      width: 180,
      cursor: 'pointer',
      border: 'none',
      textTransform: "uppercase",
      marginBlock: 20,
      marginInline: 10,
      fontSize: 12,
  }
  const styleBtnRed = {
      background: '#FB5252',
      padding: 12,
      width: 180,
      cursor: 'pointer',
      border: 'none',
      textTransform: "uppercase",
      marginBlock: 20,
      marginInline: 10,
      color: "#fff",
      fontSize: 12,
  }
  return (
    <div style={{textAlign: 'center'}} className="button-block-style">
      {props.onClickStakeMore && (
        <button
          id='stake-more'
          onClick={props.onClickStakeMore}
          style={styleBtnGreen} className="button-block-style-btn-green">
          {lang.stakeMore1 || "Stake More"}
        </button>
        )
      }
      {props.onClickStake && (
        <button
          id='stake'
          disabled={stakeDisabled}
          onClick={props.onClickStake}
          style={styleBtnGreen} className="button-block-style-btn-green">
          {lang.stake1 || "Stake"}
        </button>
      )}
      { props.onClickNext && !nextDisabled && (
        <button
          id='next'
          onClick={props.onClickNext}
          style={styleBtnGreen} className="button-block-style-btn-green">
          {props.text}
        </button>)}
       { props.onClickNext && nextDisabled && (
        <button
          id='next-disabled'
          disabled
          onClick={props.onClickNext}
          style={{...styleBtnGreen, opacity: 0.4, cursor: 'no-drop'}} className="button-block-style-btn-green">
          {lang.continue || "Next"}
        </button>)}
      {props.onClickRequest && (
        <button
          id='request-withdraw'
          onClick={props.onClickRequest}
          style={styleBtnRed} className="button-block-style-btn-red">
          {lang.requestWithdraw || "REQUEST WITHDRAW"}
        </button>
      )}
      {props.onClickWithdrawal && (
        <button
          id='withdraw'
          disabled={withdrawDisabled}
          onClick={props.onClickWithdrawal}
          style={{...styleBtnRed, opacity: withdrawDisabled && 0.4, cursor: withdrawDisabled ? 'no-drop' : 'pointer'}} className="button-block-style-btn-red">
          {lang.withdraw1 || "WITHDRAW"}
        </button>
      )}
    </div>
  );
};

export default ButtonBlock;
