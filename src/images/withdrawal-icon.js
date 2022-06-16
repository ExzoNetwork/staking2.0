import * as React from 'react';

const WithdrawalsIcon = (props) => {
  return (
    <svg width={props.width} height={props.height} viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style}>
    <path d="M12.4875 9.63498L11.7289 5.52342L3.04664 18.4399C2.83576 18.7536 2.51102 18.9692 2.14386 19.0394C1.7767 19.1095 1.3972 19.0283 1.08884 18.8138C0.780487 18.5992 0.568536 18.2688 0.499614 17.8953C0.430691 17.5217 0.510443 17.1356 0.721328 16.8219L9.40357 3.90542L5.36243 4.67724C5.18041 4.71253 4.99333 4.71093 4.81192 4.67253C4.63051 4.63413 4.45833 4.5597 4.30524 4.45349C4.15215 4.34727 4.02116 4.21137 3.91977 4.05357C3.81839 3.89576 3.74861 3.71916 3.71442 3.53387C3.68024 3.34858 3.68232 3.15825 3.72055 2.97378C3.75878 2.78931 3.83241 2.61433 3.93722 2.45886C4.04203 2.30339 4.17596 2.17049 4.33133 2.06777C4.48671 1.96505 4.66048 1.89453 4.84269 1.86025L12.226 0.450068C12.4078 0.41534 12.5945 0.417386 12.7756 0.45609C12.9566 0.494794 13.1283 0.569397 13.281 0.67564C13.4337 0.781882 13.5643 0.917684 13.6654 1.07529C13.7665 1.2329 13.8361 1.40922 13.8703 1.59419L15.2562 9.10618C15.2909 9.29137 15.2893 9.48171 15.2516 9.66628C15.2138 9.85086 15.1407 10.026 15.0363 10.1818C14.9319 10.3376 14.7983 10.4708 14.6432 10.574C14.4881 10.6771 14.3145 10.7481 14.1324 10.7829C13.9503 10.8177 13.7632 10.8156 13.5819 10.7767C13.4006 10.7378 13.2286 10.6629 13.0758 10.5562C12.923 10.4496 12.7924 10.3133 12.6914 10.1552C12.5905 9.99716 12.5212 9.82036 12.4875 9.63498Z" fill={props.fill ? props.fill : "#0BFFB7"}/>
    </svg>
  );
};

export default WithdrawalsIcon;