import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSave, faTimes } from "@fortawesome/pro-solid-svg-icons";
import {
  createColumnHelper,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  Button,
  Checkbox,
  Container,
  Pagination,
  Panel,
  TempInput,
} from "components/common";
import PageHeader from "components/layout/PageHeader";
import {
  BetaKey,
  ListBetaKeys,
} from "@storyteller/components/src/api/beta_key/ListBetaKeys";
import { EditBetaKeyNote } from "@storyteller/components/src/api/beta_key/EditBetaKeyNote";
import "./BetaKey.scss";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { useListContent } from "hooks";
import prepFilter from "resources/prepFilter";
import LoadingSpinner from "components/common/LoadingSpinner";

const columnHelper = createColumnHelper<BetaKey>();

export default function BetaKeysListPage() {
  const [loading, setLoading] = useState(true);
  const { pathname: search } = useLocation();
  const urlQueries = new URLSearchParams(search);
  const [list, listSet] = useState<BetaKey[]>([]);
  const [username, usernameSet] = useState("");
  const [onlyUnredeemed, onlyUnredeemedSet] = useState("false");
  const [inEditNoteMode, setInEditNoteMode] = useState(false);
  const [editNote, setEditNote] = useState({ token: "", note: "" });

  const keysList = useListContent({
    addQueries: {
      page_size: urlQueries.get("page_size") || "500",
      ...(username.trim()
        ? prepFilter(username, "maybe_referrer_username")
        : {}),
      ...prepFilter(onlyUnredeemed, "only_list_remaining"),
    },
    addSetters: { usernameSet },
    // debug: "ListBetaKeys",
    fetcher: ListBetaKeys,
    list,
    listSet,
    requestList: true,
    onSuccess: () => setLoading(false),
    urlParam: username.toLowerCase(),
    resultsKey: "beta_keys",
  });

  const handlePageClick = (selectedItem: { selected: number }) => {
    keysList.pageChange(selectedItem.selected);
  };

  const handleEditStart = (token: string, currentNote: string) => {
    setEditNote({ token, note: currentNote });
    setInEditNoteMode(true);
  };

  const saveNote = async (token: string, note: string | undefined) => {
    const response = await EditBetaKeyNote(token, { note });
    if (response.success) {
      // Find the index of the row with the matching token
      const rowIndex = list.findIndex(item => item.token === token);
      if (rowIndex !== -1) {
        // Create a new copy of the list
        const newList = [...list];
        // Update the note for the specific row
        newList[rowIndex] = { ...newList[rowIndex], maybe_note_html: note };
        // Update the state with the new list
        listSet(newList);
      }
    } else {
      console.log("Failed to save the note");
    }
    setInEditNoteMode(false);
  };

  const paginationProps = {
    onPageChange: handlePageClick,
    pageCount: keysList.pageCount,
    currentPage: keysList.page,
  };

  const columns = [
    columnHelper.accessor("maybe_redeemed_at", {
      id: "redeemed_status",
      header: "Redeemed?",
      cell: info => {
        const value = info.getValue();
        return value ? (
          <FontAwesomeIcon icon={faCheck} className="fs-5 text-success" />
        ) : (
          <FontAwesomeIcon icon={faTimes} className="fs-5 text-danger" />
        );
      },
    }),
    columnHelper.accessor("created_at", {
      id: "created_date",
      header: "Created Date",
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor("maybe_redeemed_at", {
      id: "redemption_date",
      header: "Redemption Date",
      cell: info => {
        const value = info.getValue();
        return value ? new Date(value).toLocaleDateString() : "-";
      },
    }),
    columnHelper.accessor("key_value", {
      id: "key",
      header: "Key",
      cell: info => {
        const key = info.getValue();
        return key || "********";
      },
    }),
    columnHelper.accessor("creator.username", {
      id: "creator",
      header: "Key Creator",
      cell: info => {
        const username = info.getValue();
        const userData = info.row.original.creator;
        const userEmailHash = userData?.gravatar_hash || "";
        return (
          <div className="d-flex gap-1 align-items-center">
            <Gravatar
              size={18}
              username={username}
              email_hash={userEmailHash}
              avatarIndex={userData?.default_avatar.image_index}
              backgroundIndex={userData?.default_avatar.color_index}
            />
            <Link to={`/profile/${username}`}>{username}</Link>
          </div>
        );
      },
    }),
    columnHelper.accessor("maybe_referrer.username", {
      id: "referrer",
      header: "Referrer",
      cell: info => {
        const username = info.getValue();
        const userData = info.row.original.maybe_referrer;
        const userEmailHash = userData?.gravatar_hash || "";

        return username ? (
          <div className="d-flex gap-1 align-items-center">
            <Gravatar
              size={18}
              username={username}
              email_hash={userEmailHash}
              avatarIndex={userData?.default_avatar.image_index}
              backgroundIndex={userData?.default_avatar.color_index}
            />
            <Link to={`/profile/${username}`}>{username}</Link>
          </div>
        ) : (
          "None"
        );
      },
    }),
    columnHelper.accessor("maybe_redeemer.username", {
      id: "redeemer",
      header: "Redeemed by",
      cell: info => {
        const username = info.getValue();
        const userData = info.row.original.maybe_redeemer;
        const userEmailHash = userData?.gravatar_hash || "";
        return username ? (
          <div className="d-flex gap-1 align-items-center">
            <Gravatar
              size={18}
              username={username}
              email_hash={userEmailHash}
              avatarIndex={userData?.default_avatar.image_index}
              backgroundIndex={userData?.default_avatar.color_index}
            />
            <Link to={`/profile/${username}`}>{username}</Link>
          </div>
        ) : (
          "-"
        );
      },
    }),
    columnHelper.accessor("maybe_note_html", {
      id: "note",
      header: "Note",
      cell: info => {
        const noteHtml = info.getValue();
        const { token } = info.row.original;

        const stripHtml = (html: string) => {
          const tmp = document.createElement("DIV");
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || "";
        };

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [localNote, setLocalNote] = useState(stripHtml(noteHtml || ""));

        const handleLocalNoteChange = (
          event: React.ChangeEvent<HTMLInputElement>
        ) => {
          setLocalNote(event.target.value);
        };

        return inEditNoteMode && editNote.token === token ? (
          <div className="d-flex gap-1 align-items-center note-cell">
            <TempInput
              type="text"
              value={localNote}
              onChange={handleLocalNoteChange}
              className="py-1 fs-7"
              style={{ width: "200px" }}
            />
            <Button
              icon={faSave}
              label="Save"
              onClick={() => saveNote(token, localNote)}
              variant="link"
              className="fs-7"
            />
          </div>
        ) : (
          <div className="d-flex gap-1 align-items-start note-cell">
            <span
              className="me-3"
              dangerouslySetInnerHTML={{
                __html: noteHtml || "-",
              }}
            />
            <Button
              label="Edit"
              onClick={() => handleEditStart(token, noteHtml || "")}
              small={true}
              variant="link"
              className="fs-7"
            />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: keysList.list,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSetUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    usernameSet(e.target.value);
  };

  const handleShowOnlyUnredeemed = (e: React.ChangeEvent<HTMLInputElement>) => {
    onlyUnredeemedSet(e.target.checked ? "true" : "false");
    keysList.reFetch();
  };

  return (
    <Container type="panel-full">
      <PageHeader title="Beta Keys List" subText="List of beta keys created" />
      <Panel padding={true}>
        <div>
          <div className="d-flex flex-column flex-lg-row gap-3">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 gap-lg-5 flex-grow-1">
              <div className="d-flex gap-1 align-items-center">
                <TempInput
                  placeholder="Search by Referrer Username"
                  value={username}
                  onChange={handleSetUsername}
                  style={{ width: "240px" }}
                  onKeyPress={event => {
                    if (event.key === "Enter") {
                      keysList.reFetch();
                    }
                  }}
                />
                <Button label="Search" onClick={keysList.reFetch} />
              </div>

              <Checkbox
                label="Show only unredeemed"
                className="mb-0 fs-7"
                onChange={handleShowOnlyUnredeemed}
                checked={onlyUnredeemed === "true"}
              />
            </div>
            <Pagination {...paginationProps} />
          </div>

          {loading ? (
            <div className="py-5">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="table-responsive mt-4 mb-4">
                <table className="table w-100 overflow-hidden">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} colSpan={header.colSpan}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {list.length === 0 && (
                <div className="my-5 text-center">No data available</div>
              )}
            </>
          )}
          <div className="d-flex justify-content-end">
            <Pagination {...paginationProps} />
          </div>
        </div>
      </Panel>
    </Container>
  );
}
