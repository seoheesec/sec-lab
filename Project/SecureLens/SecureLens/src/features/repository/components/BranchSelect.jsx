export default function BranchSelect({ value, branches = ["main"], onChange }) {
  return (
    <select value={value} onChange={(event) => onChange?.(event.target.value)}>
      {branches.map((branch) => (
        <option key={branch} value={branch}>
          {branch}
        </option>
      ))}
    </select>
  );
}
