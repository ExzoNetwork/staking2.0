import * as React from 'react';

export const EpochCurrent = ({children, ...props}) => {
  return (
    <svg
      width={25}
      height={25}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5 25C19.404 25 25 19.404 25 12.5S19.404 0 12.5 0 0 5.596 0 12.5 5.596 25 12.5 25zm0-1.74c5.943 0 10.76-4.817 10.76-10.76S18.444 1.74 12.5 1.74 1.74 6.556 1.74 12.5 6.556 23.26 12.5 23.26z"
        fill="#fff"
      />
      <mask
        id="a"
        style={{
          maskType: 'alpha',
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={25}
        height={25}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.5 25C19.404 25 25 19.404 25 12.5S19.404 0 12.5 0 0 5.596 0 12.5 5.596 25 12.5 25zm0-1.74c5.943 0 10.76-4.817 10.76-10.76S18.444 1.74 12.5 1.74 1.74 6.556 1.74 12.5 6.556 23.26 12.5 23.26z"
          fill="#fff"
        />
      </mask>
      <g mask="url(#a)">
        <path fill="#7CFFB8" d="M10.8696 -6.30435H37.3913V15.21735H10.8696z" />
      </g>
    </svg>
  );
};
