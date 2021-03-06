import * as React from "react";
import { observer } from "mobx-react";
import { action, computed, observable } from "mobx";
import { FormSection, IFormComponentProps, IFormSectionProps } from ".";
import {
  FormModel,
  SectionModel,
  ValidationErrorModel,
  ValidationErrorModelSeverity,
} from "../models";

interface IProps extends IFormComponentProps {
  form: FormModel;
  hideTitle?: boolean;
}

@observer
export class Form extends React.Component<IProps> {
  @action
  tryShowSection(newSection: SectionModel): boolean {
    if (
      this.form.currentSection &&
      this.form.sections.indexOf(this.form.currentSection) <
        this.form.sections.indexOf(newSection)
    ) {
      this.form.currentSection.validationEnabled = true;
    } else if (this.form.currentSection) {
      this.form.currentSection.validationEnabled = false;
    }

    if (!this.form.currentSection?.validationErrors.length) {
      this.form.currentSection = newSection;
      newSection.validationEnabled = false;

      return true;
    }
    this.showFirstValidationError();

    return false;
  }

  private showFirstValidationError(): void {
    this.form.currentSection?.validationErrors[0]?.component.focus();
  }

  private handleNextSectionClick = (
    e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>
  ): void => {
    e.preventDefault();
    const newIndex =
      this.form.visibleSections.indexOf(this.form.currentSection!) + 1;

    if (this.form.visibleSections.length > newIndex) {
      this.tryShowSection(this.form.visibleSections[newIndex]);
    }
  };

  private handleSubmitClick = (
    e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>
  ): void => {
    e.preventDefault();
    this.form.currentSection!.validationEnabled = true;
    if (this.form.currentSection?.validationErrors.length == 0) {
      alert("Submit");
    } else {
      this.showFirstValidationError();
    }
  };

  private handlePrevSectionClick = (
    e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const newIndex =
      this.form.visibleSections.indexOf(this.form.currentSection!) - 1;

    if (newIndex >= 0) {
      this.tryShowSection(this.form.visibleSections[newIndex]);
    }
  };

  constructor(props: IProps) {
    super(props);
    this.form = props.form;
  }

  @observable
  private form: FormModel;

  @computed
  private get fatalValidationErrors(): ValidationErrorModel[] {
    let allValidationErrors = this.form.validationErrors;
    return allValidationErrors.filter(
      (e) => e.severity === ValidationErrorModelSeverity.Fatal
    );
  }

  private renderFatalErrors() {
    return (
      <div
        className="govuk-error-summary"
        aria-labelledby="error-fatal-summary-title"
        role="alert"
        tabIndex={-1}
        data-module="govuk-error-summary"
      >
        <h2
          className="govuk-error-summary__title"
          id="error-fatal-summary-title"
        >
          There is a problem
        </h2>
        <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            {this.fatalValidationErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  @computed
  private get visibleSections(): SectionModel[] {
    if (this.props.hooks?.onGetSectionVisibility) {
      return this.props.form.sections.filter((s: SectionModel) =>
        this.props.hooks!.onGetSectionVisibility!(s)
      );
    }

    return this.props.form.visibleSections;
  }

  private renderForm() {
    return (
      <>
        {!this.props.hideTitle && (
          <h1 className="govuk-heading-xl">{this.form.options.title}</h1>
        )}

        {this.fatalValidationErrors.length > 0
          ? this.renderFatalErrors()
          : this.renderFormBody()}
      </>
    );
  }

  private renderFormSection(s: SectionModel) {
    const sectionProps: IFormSectionProps = {
      hideTitle: !!this.form.parent,
      data: s,
      hooks: this.props.hooks,
    };
    return this.props.hooks?.onRenderSection ? (
      this.props.hooks.onRenderSection(sectionProps)
    ) : (
      <FormSection {...sectionProps} />
    );
  }

  private renderFormBody() {
    return (
      <>
        {this.visibleSections
          .filter((s) => this.form.currentSection === s)
          .map((s) => (
            <div key={s.options.name} id={s.options.name}>
              {this.renderFormSection(s)}
            </div>
          ))}
        {this.form.currentSection &&
          this.form.visibleSections.indexOf(this.form.currentSection) > 0 && (
            <button
              type="button"
              disabled={this.props.form.readOnly}
              aria-disabled={this.props.form.readOnly}
              className={`govuk-button govuk-button--secondary ${
                this.props.form.readOnly ? "govuk-button--disabled" : ""
              }`}
              data-module="govuk-button"
              onClick={this.handlePrevSectionClick}
            >
              Back
            </button>
          )}
        &nbsp;&nbsp;
        {this.form.currentSection &&
          this.form.visibleSections.length >
            this.form.visibleSections.indexOf(this.form.currentSection) + 1 && (
            <button
              type="button"
              disabled={this.props.form.readOnly}
              aria-disabled={this.props.form.readOnly}
              className={`govuk-button ${
                this.props.form.readOnly ? "govuk-button--disabled" : ""
              }`}
              data-module="govuk-button"
              onClick={this.handleNextSectionClick}
            >
              Next
            </button>
          )}
        {this.form.parent == null &&
          this.form.currentSection &&
          this.form.visibleSections.length ===
            this.form.visibleSections.indexOf(this.form.currentSection) + 1 && (
            <button
              type="button"
              disabled={this.props.form.readOnly}
              aria-disabled={this.props.form.readOnly}
              className={`govuk-button ${
                this.props.form.readOnly ? "govuk-button--disabled" : ""
              }`}
              data-module="govuk-button"
              onClick={this.handleSubmitClick}
            >
              Submit
            </button>
          )}
      </>
    );
  }

  render(): React.ReactNode {
    if (this.form.parent) {
      return this.renderForm();
    }

    return <form noValidate>{this.renderForm()}</form>;
  }
}
