import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex items-center justify-center pt-24 pb-12">
        <ProfileCard />
      </div>
    </div>
  );
};

export default Profile;
