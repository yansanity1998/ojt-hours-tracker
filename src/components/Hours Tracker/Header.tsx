import React from 'react';
import logo from '../../assets/image/calendar.jpg';

const Header: React.FC = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <header className="fade-slide-up w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 mb-3 sm:mb-4">
                <div className="w-1.5 h-12 sm:h-16 bg-gradient-to-b from-[#1a2517] to-[#4A5D44] rounded-full shadow-lg"></div>
                <img
                    src={logo}
                    alt="OJT Hours logo"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md border border-white/60 bg-white"
                />
                <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1a2517] tracking-tight leading-none">
                        OJT Hours
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#ACC8A2] mt-1 sm:mt-2 tracking-wide">Professional Tracker</p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-0 sm:ml-7 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#ACC8A2] animate-pulse shadow-md"></span>
                <p className="text-xs sm:text-sm md:text-base text-[#64748B] font-semibold uppercase tracking-widest">{formattedDate}</p>
            </div>
        </header>
    );
};

export default Header;
