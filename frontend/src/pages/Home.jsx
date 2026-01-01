import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import RecommendedList from '@/components/RecommendedList'; // ✅ Added

const Home = () => {
  const { isAuthenticated, user } = useAuth(); // ✅ include user
  const { t } = useTranslation(['home']);

  // ✅ Example location (can replace with geolocation later)
  const location = { lat: 28.6139, lon: 77.2090 };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center px-6
        bg-gradient-to-br from-green-100 via-white to-green-50
        bg-cover bg-center bg-no-repeat
      "
      style={{
        backgroundImage:
          "url('https://wallpapers.com/images/hd/food-delivery-green-poster-oi97lp6ogs4prjzx.jpg')",
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className="
          relative
          w-full max-w-5xl
          rounded-[2rem]
          p-10 sm:p-16
          text-center
          overflow-hidden
          transition-all duration-500 hover:scale-[1.02]
          backdrop-blur-2xl
          bg-white/50
          border border-white/40
          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          ring-1 ring-gray-100/30
        "
      >
        {/* Decorative lights */}
        <div className="absolute -top-28 -left-28 w-96 h-96 bg-green-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-[26rem] h-[26rem] bg-yellow-200/40 rounded-full blur-3xl animate-pulse"></div>

        {/* Inner border */}
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none ring-1 ring-white/30" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-800 mb-4 leading-tight">
            Connect <span className="text-red-500">&middot;</span> Order <span className="text-red-500">&middot;</span> Grow
          </h1>

          <p className="mt-2 text-lg sm:text-xl text-gray-700 max-w-2xl">
            <span className="font-semibold text-gray-800">Artisans</span> and <span className="font-semibold text-gray-800">buyers</span> — united in a vibrant marketplace. Explore, order, and scale your business with ease.
          </p>
        </div>

        {/* Divider */}
        <div className="relative mt-10 mb-12">
          <div className="h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
        </div>

        {/* Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-5">
          {isAuthenticated ? (
            <Button
              asChild
              className="px-10 py-4 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition"
            >
              <Link to="/products">Browse Products</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                className="px-10 py-4 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition"
              >
                <Link to="/register">Get Started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-10 py-4 text-lg bg-cyan-500 font-semibold text-white rounded-xl shadow-sm border-blue-600 hover:bg-cyan-600 transition"
              >
                <Link to="/login">Login</Link>
              </Button>
            </>
          )}
        </div>

        <p className="mt-12 text-sm text-gray-600">
          Elevate your craft. Simplify your sales. Experience the future of artisan commerce.
        </p>

        {/* ✅ Recommendations section */}
        {isAuthenticated && (
          <div className="relative z-10 mt-16 text-left">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('home:recommended_for_you')}</h2>
            <RecommendedList user={user} location={location} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
