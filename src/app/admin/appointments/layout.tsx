import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/appointments">) {
  return <RequirePermission permission="appointments">{children}</RequirePermission>;
}
