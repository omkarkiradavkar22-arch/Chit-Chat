const ChitChatIcon = ({
  size = 24,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chat bubble */}
      <path
        d="
          M4.5 4.5
          C3.1 5.8 2.5 7.5 2.5 9.5
          V13
          C2.5 16.8 5.7 19.5 9.7 19.5
          H13.5
          C17.9 19.5 21.5 16.3 21.5 12
          C21.5 7.7 17.9 4.5 13.5 4.5
          H9
          C7.2 4.5 5.7 4.5 4.5 4.5
          Z

          M7 19
          L4.2 22
          L4.8 17.2
        "
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* C */}
      <path
        d="
          M11 8
          C9.1 8 8 9.4 8 12
          C8 14.6 9.1 16 11 16
          C12 16 12.8 15.7 13.4 15.1
        "
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* C */}
      <path
        d="
          M17.2 8.6
          C16.6 8.2 16 8 15.3 8
          C13.5 8 12.4 9.4 12.4 12
          C12.4 14.6 13.5 16 15.3 16
          C16 16 16.7 15.8 17.3 15.3
        "
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ChitChatIcon;