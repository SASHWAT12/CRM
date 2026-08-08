import { Suspense } from "react";
import { getUser } from "@/actions/get-user";
import { redirect } from "next/navigation";
import Container from "../components/ui/Container";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileTabs } from "./components/ProfileTabs";
import { ProfileTabContent } from "./components/tabs/ProfileTabContent";

const ProfilePage = async () => {
  const data = await getUser();

  if (!data) {
    redirect("/sign-in");
  }

  return (
    <Container title="User Profile" description="Manage your account profile and personal details">
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <ProfileHero data={data} />
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <ProfileTabs
            profileContent={<ProfileTabContent data={data} />}
            emailsContent={
              <div className="p-5 text-sm text-muted-foreground">
                Email account integrations are configured via system administration.
              </div>
            }
          />
        </Suspense>
      </div>
    </Container>
  );
};

export default ProfilePage;
