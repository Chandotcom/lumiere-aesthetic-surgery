import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/users">) {
  return <RequirePermission permission="users">{children}</RequirePermission>;
}
