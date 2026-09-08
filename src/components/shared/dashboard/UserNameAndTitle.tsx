import React from "react";

type UserNameAndTitleProps = {
  name: string;
  title?: string;
};

const UserNameAndTitle = ({ name, title }: UserNameAndTitleProps) => {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{name}</p>

      {title && (
        <p className="text-[13px] text-muted-foreground">{title}</p>
      )}
    </div>
  );
};

export default UserNameAndTitle;
