import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import mainImage from '../../assets/image/calendar.jpg';
import internImage from '../../assets/image/intern.jpg';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isRolling, setIsRolling] = useState(false);

    useEffect(() => {
        // Trigger animations after component mounts
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleNavigation = (path: string) => {
        setIsRolling(true);
        // Wait for roll animation to complete before navigating
        setTimeout(() => {
            navigate(path);
        }, 850);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 pb-12 font-sans text-white relative overflow-hidden">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${internImage})`,
                    filter: 'blur(2px) brightness(0.8)',
                    transform: 'scale(1.1)', // To avoid blurred edges
                }}
            />
            {/* Dark Green Overlay */}
            <div className="absolute inset-0 z-0 bg-[#4b5d2a]/70" />

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                {/* Logo with fade-in and scale animation */}
                <div
                    className={`w-40 h-40 md:w-56 md:h-56 relative rounded-full overflow-hidden transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                        } ${isRolling ? 'animate-roll' : ''
                        }`}
                    style={{ transitionDelay: '100ms' }}
                >
                    <img
                        src={mainImage}
                        alt="OJTHub Logo"
                        className="w-full h-full object-cover rounded-full transition-transform duration-500 hover:scale-110"
                    />
                </div>

                {/* Title with fade-in and slide-up animation */}
                <h1
                    className={`text-4xl font-extrabold text-white tracking-tight mt-6 mb-1 text-center transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                    style={{ transitionDelay: '300ms' }}
                >
                    OJTHub
                </h1>

                {/* Subtitle with fade-in and slide-up animation */}
                <p
                    className={`text-gray-100 font-medium text-center max-w-[80%] leading-tight transform transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                    style={{ transitionDelay: '450ms' }}
                >
                    Empowering your internship journey
                </p>
            </div>

            {/* Buttons Section with fade-in and slide-up animation */}
            <div className="w-full space-y-4 mt-auto pt-8 z-10">
                <button
                    onClick={() => handleNavigation('/register')}
                    className={`w-full bg-white hover:bg-gray-100 text-[#1a2517] font-bold py-4 rounded-2xl shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 active:scale-[0.96] transition-all duration-300 text-lg transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                    style={{ transitionDelay: '600ms' }}
                >
                    Create an account
                </button>

                <button
                    onClick={() => handleNavigation('/login')}
                    className={`w-full bg-transparent border-2 border-white text-white font-bold py-4 rounded-2xl hover:bg-white/10 hover:border-white/90 hover:shadow-lg hover:shadow-white/20 active:scale-[0.96] transition-all duration-300 text-lg transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                    style={{ transitionDelay: '750ms' }}
                >
                    I already have an account
                </button>
            </div>
        </div>
    );
};
export default LandingPage;
