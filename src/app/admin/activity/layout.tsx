import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/activity">) {
  return <RequirePermission permission="activity">{children}</RequirePermission>;
}
