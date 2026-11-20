import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/forms">) {
  return <RequirePermission permission="content">{children}</RequirePermission>;
}
