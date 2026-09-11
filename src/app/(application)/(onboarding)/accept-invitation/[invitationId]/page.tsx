import AcceptInvitation from "@/components/organization/accept-invitation";
import { getInvitationOrganization } from "@/server/organization/getInvitationOrganization";
import { redirect } from "next/navigation";

const AcceptInvitationPage = async ({
  params,
}: {
  params: Promise<{
    invitationId: string;
  }>;
}) => {
  const { invitationId } = await params;

  const result = await getInvitationOrganization(invitationId);

  if (!result.success) {
    redirect("/");
  }

  return (
    <AcceptInvitation
      invitationId={invitationId}
      organizationName={result.data.name}
    />
  );
};

export default AcceptInvitationPage;
