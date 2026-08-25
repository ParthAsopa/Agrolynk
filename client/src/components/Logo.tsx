import { Link } from "wouter";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const textClasses = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
  };

  return (
    <Link href="/">
      <div className={`flex items-center ${className} cursor-pointer`}>
        <svg 
          className={`text-primary h-8 ${size === "small" ? "h-6" : size === "large" ? "h-10" : "h-8"}`} 
          fill="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15.5,2C13,2 11,4 11,6.5C11,9 13,11 15.5,11C18,11 20,9 20,6.5C20,4 18,2 15.5,2M10.59,3.19L8.72,4.47L10.18,6.36C9.45,8.56 10.06,11.12 12,12.67C13.81,14.13 16.27,14.21 18.17,12.97L19.29,14.38L21.07,13.11L10.59,3.19M4.76,4.59L3.49,5.86H5.25C4.46,6.75 4,7.96 4,9.25C4,12.07 6.18,14.25 9,14.25C10.21,14.25 11.34,13.85 12.21,13.17L10.97,11.92C10.42,12.28 9.73,12.5 9,12.5C7.17,12.5 5.75,11.07 5.75,9.25C5.75,8.5 5.97,7.8 6.34,7.23L7.23,8.13L8.86,6.5L4.76,4.59Z" />
        </svg>
        <span className={`ml-2 ${textClasses[size]} font-bold text-primary`}>
          AgroLynk
        </span>
      </div>
    </Link>
  );
}
