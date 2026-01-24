import React from 'react';
import logo from '../../assets/image/calendar.jpg';
import intern2 from '../../assets/image/intern2.jpg';

const Header: React.FC = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <header className="fade-slide-up w-full relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-[#1a2517]">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${intern2})`,
                    filter: 'blur(2px) brightness(0.8)',
                    transform: 'scale(1.1)', // To avoid blurred edges
                }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a2517]/70 to-[#4A5D44]/70" />

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 mb-3 sm:mb-4">
                    <div className="w-1.5 h-12 sm:h-16 bg-gradient-to-b from-[#ACC8A2] to-[#4A5D44] rounded-full shadow-lg"></div>
                    <img
                        src={logo}
                        alt="OJT Hours logo"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md border border-white/60 bg-white"
                    />
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                            OJT Hours
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#ACC8A2] mt-1 sm:mt-2 tracking-wide">Professional Tracker</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-0 sm:ml-7 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#ACC8A2] animate-pulse shadow-md"></span>
                    <p className="text-xs sm:text-sm md:text-base text-white/60 font-semibold uppercase tracking-widest">{formattedDate}</p>
                </div>
            </div>
        </header>
    );
};

export default Header;
