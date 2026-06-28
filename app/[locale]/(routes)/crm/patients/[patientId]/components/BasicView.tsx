import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CalendarDays,
  CoinsIcon,
  Facebook,
  Instagram,
  LayoutGrid,
  Linkedin,
  Twitter,
  User,
  Youtube,
} from "lucide-react";
import moment from "moment";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { PatientDetailActions } from "./PatientDetailActions";
import { getAllCrmData } from "@/actions/crm/get-crm-data";

interface OppsViewProps {
  data: any;
}

export async function BasicView({ data }: OppsViewProps) {
  //console.log(data, "data");
  const users = await prismadb.users.findMany();
  const crmData = await getAllCrmData();
  const contactTypes = crmData.contactTypes;
  if (!data) return <div>Opportunity not found</div>;
  return (
    <div className="pb-3 space-y-5">
      {/*      <pre>{JSON.stringify(data, null, 2)}</pre> */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex w-full justify-between">
            <div>
              <CardTitle>
                {data.first_name} {data.last_name}
              </CardTitle>
              <CardDescription>ID:{data.id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <PatientDetailActions contact={data} contactTypes={contactTypes} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 w-full ">
            <div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-sm text-muted-foreground">
                    {data.assigned_accounts?.name ?? "N/A"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Birthday</p>
                  <p className="text-sm text-muted-foreground">
                    {data.birthday
                      ? moment(data.birthday).format("MMM DD YYYY")
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.description ? data.description : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <User className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Assigned to
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {users.find((user) => user.id === data.assigned_to)?.name ?? "Unassigned"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {moment(data.created_on).format("MMM DD YYYY")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Created by</p>
                  <p className="text-sm text-muted-foreground">
                    {users.find((user) => user.id === data.createdBy)?.name ?? "N/A"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Last update
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {moment(data.updatedAt).format("MMM DD YYYY")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Last update by
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {users.find((user) => user.id === data.updatedBy)?.name ?? "N/A"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {data.status ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Type</p>
                  <p className="text-sm text-muted-foreground">{data.contact_type?.name ?? "—"}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 col-span-2 mt-4">
              <div> Tags:</div>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag: string) => (
                  <Badge key={tag} variant={"outline"}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">E-mail</p>
                {data?.email ? (
                  <Link
                    href={`mailto:${data.email}`}
                    className="flex items-center  gap-5 text-sm text-muted-foreground"
                  >
                    {data.email}
                    <EnvelopeClosedIcon />
                  </Link>
                ) : "N/A"}
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Personal e-mail
                </p>
                {data?.personal_email ? (
                  <Link
                    href={`mailto:${data.personal_email}`}
                    className="flex items-center  gap-5 text-sm text-muted-foreground"
                  >
                    {data.personal_email}
                    <EnvelopeClosedIcon />
                  </Link>
                ) : "N/A"}
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Office phone</p>
                <p className="text-sm text-muted-foreground">
                  {data.office_phone ?? "N/A"}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Mobile phone</p>
                <p className="text-sm text-muted-foreground">
                  {data.mobile_phone ?? "N/A"}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Billing country
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_country ?? "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.notes && data.notes.length > 0 ? (
                data.notes.map((note: string) => (
                  <p className="text-sm text-muted-foreground border-b pb-1" key={note}>
                    {note}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <details className="group border rounded-lg p-4 bg-muted/20">
        <summary className="cursor-pointer font-medium text-sm text-muted-foreground select-none hover:text-foreground transition-colors">
          Additional CRM Fields (Website, Position, Social Networks, etc.)
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Metadata & Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Position</p>
                <p className="text-sm">{data.position || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Website</p>
                <p className="text-sm">{data.website ? <Link href={data.website} className="text-primary hover:underline">{data.website}</Link> : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Member of</p>
                <p className="text-sm">{data.member_of || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Industry</p>
                <p className="text-sm">{data.industry || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Social networks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Twitter: {data.social_twitter || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Facebook className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Facebook: {data.social_facebook || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">LinkedIn: {data.social_linkedin || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Instagram className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Instagram: {data.social_instagram || "N/A"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Youtube className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">YouTube: {data.social_youtube || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </details>
    </div>
  );
}
