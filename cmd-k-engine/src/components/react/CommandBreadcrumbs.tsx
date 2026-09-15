export function CommandBreadcrumbs({ breadcrumbs }: { breadcrumbs: string[] }) {
  return (
    <div className="breadcrumbs">
      <span>Commands</span>
      {breadcrumbs.map((breadcrumb) => (
        <span key={breadcrumb}>
          <span aria-hidden="true"> / </span>
          {breadcrumb}
        </span>
      ))}
    </div>
  )
}
