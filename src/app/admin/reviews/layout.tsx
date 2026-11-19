import { RequirePermission } from "@/components/admin/require-permission";

export default function Layout({ children }: LayoutProps<"/admin/reviews">) {
  return <RequirePermission permission="reviews">{children}</RequirePermission>;
}
