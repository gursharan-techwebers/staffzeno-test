"use client";

import { BadgeCheckIcon, MailIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

import { getInitials } from "@/lib/utils";

type UserProfileProps = {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  title?: string | null;
};

export function UserProfile({ user, title }: UserProfileProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Popover>
      {/* Table Avatar */}
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View ${user.name}'s profile`}
          className="group shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-9.5 ring-1 ring-border transition-all group-hover:ring-2 group-hover:ring-primary/30">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />

            <AvatarFallback className="bg-muted text-sm font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      {/* Profile Card */}
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={10}
        className="w-70 overflow-hidden rounded-2xl border bg-background p-0 shadow-xl"
      >
        {/* Cloud Header */}
        <div className="relative h-42 overflow-visible">
          {/* Static Cloud Image */}
          <img
            src="/images/profile-clouds.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div
            className="absolute inset-0 bg-linear-to-b from-background/40 via-background/50 to-background/60 dark:to-background/90"
            aria-hidden="true"
          />

          {/* Contact */}
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="absolute right-4 top-4 z-10 rounded-full px-4 shadow-sm"
          >
            <a href={`mailto:${user.email}`} className="text-sm font-medium">
              Contact
            </a>
          </Button>

          {/* Profile Image */}
          <div className="absolute -bottom-8 left-5 z-10">
            <Avatar className="size-25 rounded-full border-4 border-background bg-background shadow-md">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name}
                className="object-cover"
              />

              <AvatarFallback className="rounded-full bg-muted text-4xl font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-5 pb-5 pt-10">
          {/* Name */}
          <div className="flex items-center gap-1.5">
            <h3 className="min-w-0 truncate text-xl font-semibold tracking-tight">
              {user.name}
            </h3>

            <BadgeCheckIcon
              className="size-5 shrink-0 fill-green-500 text-background"
              aria-label="Verified"
            />
          </div>

          {/* Title */}
          {title?.trim() && (
            <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
              {title}
            </p>
          )}

          {/* Current Time */}
          {currentTime && (
            <div className="mt-4 flex items-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {currentTime}
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
