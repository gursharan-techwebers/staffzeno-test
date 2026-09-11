import { redirect } from "next/navigation";

import AcceptInvitation from "@/components/organization/accept-invitation";
import { getInvitationOrganization } from "@/server/organization/getInvitationOrganization";

type Props = {
  params: Promise<{
    invitationId: string;
  }>;
};

const AcceptInvitationPage = async ({ params }: Props) => {
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