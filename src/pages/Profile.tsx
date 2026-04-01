import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import RiotProfileSection from "@/components/RiotProfileSection";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left: Profile Card */}
          <div className="flex justify-center lg:justify-start">
            <ProfileCard />
          </div>

          {/* Right: Riot Stats */}
          <div>
            <RiotProfileSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
