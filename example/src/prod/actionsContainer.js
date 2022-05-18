import * as React from 'react';
import { formatStakeAmount } from './format-value';

const Actions = (props) => {
  const { stakingStore, amountToConvert, lang } = props;

  if (stakingStore.isRefreshing) return null;
  const details = stakingStore.getValidatorDetails();
  const ADDRESS = details ? details.address : '...';
  const swapAmount = stakingStore.getSwapAmountByStakeAmount(amountToConvert);
  const amount = formatStakeAmount(swapAmount || '0');

  const { styleh3, flex, styleNumber, textStyle, styleAddress, styleNumberSm } = styles;

  return (

      <div style={{marginInline: 15}}>
        <h3 style={styleh3} className="actions-styleh3">{lang.titleItemsStake || "These actions will be made"}</h3>

        {!swapAmount || swapAmount.isZero() ? (
          <>
            <div style={flex} className="actions-flex">
              <div style={styleNumberSm} className="actions-style-number">1</div>
              <div style={textStyle} className="actions-text-style">
                {lang.stepItem2 || "Create Stake Account"}
              </div>
            </div>
            <div style={flex} className="actions-flex">
              <div style={styleNumber} className="actions-style-number">2</div>
              <div style={textStyle} className="actions-text-style">
               {lang.stepItem3 || "Stake to Validator"} - <div style={styleAddress} className="actions-style-address">{ADDRESS.substr(0, 30)}</div><div style={styleAddress} className="actions-style-address">{ADDRESS.substr(30)}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={flex} className="actions-styleh3">
              <div style={styleNumber} className="actions-style-number">1</div>
              <div style={textStyle} className="actions-text-style">
                {lang.stepItem1 || "Convert"} {amount} {lang.stepItem1Part || "VLX EVM to VLX Native"}
              </div>
            </div>
            <div style={flex} className="actions-flex">
              <div style={styleNumber} className="actions-style-number">2</div>
              <div style={textStyle} className="actions-text-style">
                {lang.stepItem2 || "Create Stake Account"}
              </div>
            </div>
            <div style={flex} className="actions-flex">
              <div style={styleNumber} className="actions-style-number">3</div>
              <div style={textStyle} className="actions-text-style">
              {lang.stepItem3 || "Stake to Validator"} - <div style={styleAddress} className="actions-style-address">{ADDRESS.substr(0, 30)}</div><div style={styleAddress} className="actions-style-address">{ADDRESS.substr(30)}</div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

const styles = {
  styleh3: {
    color: '#fff',
    fontSize: 18,
    marginBlock: 15,
    textAlign: 'left',
  },
  styleNumber: {
    backgroundColor: '#ffffff40',
    border: '0.5px solid #fff',
    borderRadius: 100,
    height: 25,
    width: 25,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: "absolute",
    top: 0
  },
  styleNumberSm: {
    backgroundColor: '#ffffff40',
    border: '0.5px solid #fff',
    borderRadius: 100,
    height: 25,
    width: 25,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: "absolute",
    top: -5
  },
  textStyle: {
    fontSize: 14,
    alignItems: 'center',
    display: 'block',
    textAlign: 'left',
    paddingInline: 50,
  },
  flex: {
    position: "relative",
    marginBlock: 50,
  },
  styleAddress: {
    color: "#FFA607",
    marginTop: 3
  },
}

export default Actions;
