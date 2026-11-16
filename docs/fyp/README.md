# Final Year Project material

Documentation and figures for the SmartHire FYP report. Nothing here is used by the
running application — the app lives in [`client/`](../../client) and [`server/`](../../server).

| Path | Contents |
| --- | --- |
| `SmartHire_UML_Diagrams.docx` | Use case, class, sequence, activity, component, deployment, package and collaboration diagrams |
| `diagrams/` | Architecture and ERD figures used in the report |
| `diagrams/uml_diagrams/` | The eight UML figures, as PNGs |
| `tools/` | Python scripts that generate everything above |

## Regenerating the figures

The scripts need Python 3 and Pillow:

```bash
pip install pillow
```

Rebuild the UML diagrams and the `.docx`:

```bash
python docs/fyp/tools/build_smarthire_uml_diagrams_doc.py
```

Rebuild the report figures and `SmartHire_FYP_Report_Revised.docx`:

```bash
python docs/fyp/tools/generate_fyp_report.py
```

Both scripts resolve every path relative to this folder, so they run from any checkout on
Windows, macOS or Linux. They prefer Arial and Times New Roman and fall back to the
metrically identical Liberation fonts when those are not installed.
