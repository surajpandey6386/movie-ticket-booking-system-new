import React from "react";
import backgroundImg from "../assets/background.png";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center bg-no-repeat h-screen"
      style={{
        backgroundImage: `url(${backgroundImg})`,
      }}
    >
     

      <button
  onClick={() => navigate("/movies")}
  className="absolute bottom-10 left-6 md:left-16 lg:left-36 flex items-center gap-2 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
>
  Explore Movies
  <ArrowRight className="w-5 h-5" />
</button>
    </div>
  );
};

export default HeroSection;