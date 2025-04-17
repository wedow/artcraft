import os
import hashlib
import filecmp
from pathlib import Path
from datetime import datetime
import difflib


def get_file_hash(filepath):
    """Calculate MD5 hash of a file."""
    md5_hash = hashlib.md5()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
        return md5_hash.hexdigest()
    except Exception:
        return "Error calculating hash"


def format_size(size_bytes):
    """Format file size nicely."""
    if size_bytes < 1000:
        return f"{size_bytes}B"
    elif size_bytes < 1000000:
        return f"{size_bytes / 1000:.1f}KB"
    else:
        return f"{size_bytes / 1000000:.1f}MB"


def count_lines(filepath):
    """Count lines in a file safely."""
    try:
        with open(filepath, "rb") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def calculate_diff_ratio(file1, file2):
    """Calculate how different two files are using difflib."""
    try:
        with (
            open(file1, "r", errors="replace") as f1,
            open(file2, "r", errors="replace") as f2,
        ):
            text1 = f1.readlines()
            text2 = f2.readlines()
            matcher = difflib.SequenceMatcher(None, text1, text2)
            return 1.0 - matcher.ratio()  # Higher value means more different
    except Exception:
        return 1.0  # If we can't compare, assume completely different


def get_relative_path(file_path, base_path):
    """Get relative path from base directory."""
    return str(Path(file_path).relative_to(base_path))


def collect_files_recursive(folder_path):
    """Recursively collect all files in a folder."""
    folder_path = Path(folder_path)
    file_dict = {}

    for path in folder_path.rglob("*"):
        if path.is_file():
            rel_path = get_relative_path(path, folder_path)
            file_dict[rel_path] = path

    return file_dict


def compare_folders_recursive(folder1, folder2, output_file=None):
    """Compare two folders recursively and generate a detailed report."""
    # Automatically generate output filename if not specified
    if output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"folder_comparison_{timestamp}.md"

    # Get folder paths
    folder1_path = Path(folder1)
    folder2_path = Path(folder2)

    # Get shorthand names for display
    folder1_name = folder1_path.name
    folder2_name = folder2_path.name

    # Get all files recursively
    print(f"Collecting files from {folder1_name}...")
    files1 = collect_files_recursive(folder1_path)
    print(f"Collecting files from {folder2_name}...")
    files2 = collect_files_recursive(folder2_path)

    # All unique file paths across both folders
    all_files = sorted(set(files1.keys()) | set(files2.keys()))

    # Calculate column widths for alignment
    max_filepath_len = max(len(file) for file in all_files) + 2
    hash_col_width = 10  # For hash comparison
    size_col_width = 20  # For size and line count
    diff_col_width = 30  # For difference description

    # Initialize report
    report = [
        f"# Recursive Folder Comparison Report: {folder1_name} vs {folder2_name}\n",
        f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "## File Comparison Table\n",
        f"| {'File Path'.ljust(max_filepath_len)} | {'Status'.ljust(hash_col_width)} | {folder1_name.ljust(size_col_width)} | {folder2_name.ljust(size_col_width)} | {'Difference'.ljust(diff_col_width)} |",
        f"|{'-' * max_filepath_len}|{'-' * hash_col_width}|{'-' * size_col_width}|{'-' * size_col_width}|{'-' * diff_col_width}|",
    ]

    # Track file categories
    identical_files = []
    different_files = []
    only_in_folder1 = []
    only_in_folder2 = []

    # Store detailed file comparisons for sorting later
    file_comparisons = []

    # Compare each file
    print(f"Comparing {len(all_files)} unique files...")
    for rel_path in all_files:
        in_folder1 = rel_path in files1
        in_folder2 = rel_path in files2

        # Default values
        status = "—"
        size1_str = "—"
        size2_str = "—"
        diff_str = "—"
        diff_ratio = 0

        # Get details for folder1
        if in_folder1:
            file1 = files1[rel_path]
            size1 = file1.stat().st_size
            lines1 = count_lines(file1)
            hash1 = get_file_hash(file1)
            size1_str = f"{format_size(size1)} ({lines1} lines)"
        else:
            hash1 = "—"
            size1 = 0
            lines1 = 0

        # Get details for folder2
        if in_folder2:
            file2 = files2[rel_path]
            size2 = file2.stat().st_size
            lines2 = count_lines(file2)
            hash2 = get_file_hash(file2)
            size2_str = f"{format_size(size2)} ({lines2} lines)"
        else:
            hash2 = "—"
            size2 = 0
            lines2 = 0

        # Calculate difference and determine status
        if not in_folder1:
            status = "MISSING"
            diff_str = f"Only in {folder2_name}"
            only_in_folder2.append(rel_path)
            diff_ratio = 1.0  # Completely different (missing)
        elif not in_folder2:
            status = "MISSING"
            diff_str = f"Only in {folder1_name}"
            only_in_folder1.append(rel_path)
            diff_ratio = 1.0  # Completely different (missing)
        else:
            # Both files exist, compare them
            if hash1 == hash2 and hash1 != "Error calculating hash":
                status = "IDENTICAL"
                diff_str = "Identical content"
                identical_files.append(rel_path)
                diff_ratio = 0.0
            else:
                status = "DIFFERENT"
                size_diff = size2 - size1
                lines_diff = lines2 - lines1
                sign = "+" if size_diff > 0 else ""
                sign_lines = "+" if lines_diff > 0 else ""

                # Calculate how different the files are
                diff_ratio = calculate_diff_ratio(file1, file2)
                different_files.append((rel_path, diff_ratio))

                # Format difference description
                diff_pct = int(diff_ratio * 100)
                diff_str = f"{sign}{format_size(size_diff)} ({sign_lines}{lines_diff} lines) {diff_pct}% different"

        # Store comparison for sorting later
        file_comparisons.append(
            {
                "rel_path": rel_path,
                "status": status,
                "size1_str": size1_str,
                "size2_str": size2_str,
                "diff_str": diff_str,
                "diff_ratio": diff_ratio,
                "in_folder1": in_folder1,
                "in_folder2": in_folder2,
                "hash1": hash1[:8] if len(hash1) > 8 else hash1,
                "hash2": hash2[:8] if len(hash2) > 8 else hash2,
            }
        )

    # Sort files by difference ratio (most different first)
    file_comparisons.sort(key=lambda x: x["diff_ratio"], reverse=True)

    # Generate the sorted table
    for comp in file_comparisons:
        hash_display = (
            f"{comp['hash1']}:{comp['hash2']}"
            if comp["status"] == "DIFFERENT"
            else comp["status"]
        )
        report.append(
            f"| {comp['rel_path'].ljust(max_filepath_len)} | "
            f"{hash_display.ljust(hash_col_width)} | "
            f"{comp['size1_str'].ljust(size_col_width)} | "
            f"{comp['size2_str'].ljust(size_col_width)} | "
            f"{comp['diff_str'].ljust(diff_col_width)} |"
        )

    # Sort different files by difference ratio for the detailed section
    different_files.sort(key=lambda x: x[1], reverse=True)

    # Add Files Missing From Each Folder sections
    report.append("\n## Files Present in One Folder But Missing in the Other\n")

    if only_in_folder1:
        report.append(
            f"\n### Files Only in {folder1_name} ({len(only_in_folder1)} files)"
        )
        for rel_path in sorted(only_in_folder1):
            file1 = files1[rel_path]
            size1 = file1.stat().st_size
            lines1 = count_lines(file1)
            hash1 = get_file_hash(file1)[:8]
            report.append(
                f"- `{rel_path}` ({format_size(size1)}, {lines1} lines, hash: {hash1})"
            )

    if only_in_folder2:
        report.append(
            f"\n### Files Only in {folder2_name} ({len(only_in_folder2)} files)"
        )
        for rel_path in sorted(only_in_folder2):
            file2 = files2[rel_path]
            size2 = file2.stat().st_size
            lines2 = count_lines(file2)
            hash2 = get_file_hash(file2)[:8]
            report.append(
                f"- `{rel_path}` ({format_size(size2)}, {lines2} lines, hash: {hash2})"
            )

    # Add detailed section for different files
    if different_files:
        report.append(f"\n## Files with Differences (Sorted by Most Different First)\n")
        for rel_path, diff_ratio in different_files:
            file1 = files1[rel_path]
            file2 = files2[rel_path]
            size1 = file1.stat().st_size
            size2 = file2.stat().st_size
            lines1 = count_lines(file1)
            lines2 = count_lines(file2)
            hash1 = get_file_hash(file1)[:8]
            hash2 = get_file_hash(file2)[:8]
            size_diff = size2 - size1
            lines_diff = lines2 - lines1
            diff_pct = int(diff_ratio * 100)

            report.append(f"### `{rel_path}` ({diff_pct}% different)")
            report.append(
                f"- {folder1_name}: {format_size(size1)}, {lines1} lines, hash: {hash1}"
            )
            report.append(
                f"- {folder2_name}: {format_size(size2)}, {lines2} lines, hash: {hash2}"
            )
            report.append(
                f"- Difference: {size_diff:+d} bytes, {lines_diff:+d} lines\n"
            )

    # Add summary section
    report.extend(
        [
            "\n## Summary",
            f"- **Total Unique Files**: {len(all_files)}",
            f"- **Files in {folder1_name}**: {len(files1)}",
            f"- **Files in {folder2_name}**: {len(files2)}",
            f"- **Identical Files**: {len(identical_files)}",
            f"- **Different Files**: {len(different_files)}",
            f"- **Files Only in {folder1_name}**: {len(only_in_folder1)}",
            f"- **Files Only in {folder2_name}**: {len(only_in_folder2)}",
            f"\n## Path Information",
            f"- {folder1_name}: `{folder1}`",
            f"- {folder2_name}: `{folder2}`",
        ]
    )

    # Write report to file
    with open(output_file, "w") as f:
        f.write("\n".join(report))

    print(f"Recursive comparison report written to {output_file}")
    return "\n".join(report)


# Execute the comparison
if __name__ == "__main__":
    folder1 = "/Users/michaelchung/storyteller-rust/frontend/apps/editor2d/src/Classes/"
    folder2 = "/Users/michaelchung/storyteller-rust/frontend/apps/editor3d/app/Classes/"

    report = compare_folders_recursive(folder1, folder2)
