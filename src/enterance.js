import * as React from 'react';
import EnteranceImg from './images/enterance-img';
import ExitValidatorImg from './images/exit-validator-img';

const Enterance = (props) => {
  const {lang} = props;
  const styleh3 = {
    color: '#fff',
    fontSize: 18,
    marginBlock: 15,
    textAlign: 'center',
  };
  const container = {
    flexDirection: 'column',
    display: 'flex',
    alignItems: 'center',
    marginTop: 100,
    textAlign: "center"
  };
  const textStyle = {
    fontSize: 14,
    alignItems: 'center',
    display: 'block',
    paddingInline: 50,
    marginBlock: 20
  };
  const styleLink = {
    color: 'blue',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: 14,
    marginBottom: 20
  };
  const link =
    'https://support.velas.com/hc/en-150/articles/360021044820-Delegation-Warmup-and-Cooldown';

  return (
    <div style={container} className="enterance-container">
      {props.enteranceImg && <EnteranceImg width="107" height="115" />}
      {props.exitValidatorImg && <ExitValidatorImg width="107" height="115" />}
      <h3 style={styleh3} className="enterance-styleh3">{props.title}</h3>
      <div style={textStyle} className="enterance-textStyle">{props.subtitle}</div>
      {props.link && (
        <a href={link} target="_blank" style={styleLink} className="enterance-style-link">
          {lang.read || "Read More"}.
        </a>
      )}
    </div>
  );
};

export default Enterance;
