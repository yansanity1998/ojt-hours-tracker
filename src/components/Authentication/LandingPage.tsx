import { useNavigate } from 'react-router-dom';
import mainImage from '../../assets/image/calendar.jpg';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#4b5d2a] flex flex-col items-center p-8 pb-12 font-sans text-white relative overflow-hidden">

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                <div className="w-40 h-40 md:w-56 md:h-56 relative rounded-full overflow-hidden">
                    <img
                        src={mainImage}
                        alt="OJTHub Logo"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>

                <h1 className="text-4xl font-extrabold text-white tracking-tight mt-6 mb-1 text-center">
                    OJTHub
                </h1>
                <p className="text-gray-100 font-medium text-center max-w-[80%] leading-tight">
                    Empowering your internship journey
                </p>
            </div>

            {/* Buttons Section */}
            <div className="w-full space-y-4 mt-auto pt-8">
                <button
                    onClick={() => navigate('/register')}
                    className="w-full bg-white hover:bg-gray-100 text-[#1a2517] font-bold py-4 rounded-2xl shadow-xl shadow-black/20 active:scale-[0.98] transition-all duration-200 text-lg"
                >
                    Create an account
                </button>

                <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-transparent border-2 border-white text-white font-bold py-4 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all duration-200 text-lg"
                >
                    I already have an account
                </button>
            </div>
        </div>
    );
};
export default LandingPage;
