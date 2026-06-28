import { getUsers } from "@/actions/get-users";
import React from "react";
import Container from "../../components/ui/Container";
import { UserForm } from "./components/UserForm";
import { Separator } from "@/components/ui/separator";

import { getSession } from "@/lib/auth-server";
import { AdminUserDataTable } from "./table-components/data-table";
import { columns } from "./table-components/columns";
import { Users } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

const AdminUsersPage = async () => {
  const users: Users[] = await getUsers();
  const t = await getTranslations("AdminPage");

  const session = await getSession();

  return (
    <Container
      title="User Administration"
      description="Create and manage your hospital system users and roles."
    >
      <div className="space-y-8 mt-2">
        <UserForm actorRole={session.user.role} />
        <AdminUserDataTable
          columns={columns}
          data={users}
          actorRole={session.user.role}
          actorId={session.user.id}
        />
      </div>
    </Container>
  );
};

export default AdminUsersPage;
